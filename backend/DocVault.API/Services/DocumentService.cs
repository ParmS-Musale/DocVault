using DocVault.API.DTOs;
using DocVault.API.Interfaces;
using DocVault.API.Models;

namespace DocVault.API.Services;

public class DocumentService : IDocumentService
{
    private static readonly TimeSpan SasValidityPeriod = TimeSpan.FromHours(1);

    private readonly IBlobStorageService _blobStorage;
    private readonly ICosmosDbService _cosmosDb;
    private readonly IEventService _eventService; // Added
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(
        IBlobStorageService blobStorage,
        ICosmosDbService cosmosDb,
        IEventService eventService, // Added
        ILogger<DocumentService> logger)
    {
        _blobStorage = blobStorage;
        _cosmosDb = cosmosDb;
        _eventService = eventService; // Added
        _logger = logger;
    }

    public async Task<UploadResponseDto> UploadDocumentAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        long fileSize,
        string userId,
        CancellationToken ct = default)
    {
        if (fileStream == null || fileStream.Length == 0)
            throw new ArgumentException("File stream is empty.");

        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        _logger.LogInformation(
            "Uploading {FileName} ({FileSize} bytes) for user {UserId}",
            fileName, fileSize, userId);

        // 1️⃣ Upload to Blob Storage
        var metadata = new Dictionary<string, string>
        {
            { "userId", userId }
        };

        var (blobName, blobUrl) = await _blobStorage.UploadAsync(
            fileStream, fileName, contentType, metadata, ct);

        // 2️⃣ Create Cosmos metadata record
        var record = new DocumentRecord
        {
            Id = Guid.NewGuid().ToString(),
            FileName = fileName,
            FileSize = fileSize,
            ContentType = contentType,
            UploadDate = DateTime.UtcNow,
            BlobUrl = blobUrl,
            BlobName = blobName,
            UserId = userId
        };

        try
        {
            await _cosmosDb.CreateDocumentAsync(record, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Cosmos DB insert failed for blob {BlobName}", blobName);

            // Rollback blob if DB fails
            await _blobStorage.DeleteAsync(blobName, ct);

            throw;
        }

        // 3️⃣ Generate SAS URL
        var sasUrl = await _blobStorage.GenerateSasUrlAsync(blobName, SasValidityPeriod, ct);

        var responseDto = new UploadResponseDto(
            Id: record.Id,
            FileName: record.FileName,
            FileSize: record.FileSize,
            ContentType: record.ContentType,
            UploadDate: record.UploadDate,
            DownloadUrl: sasUrl,
            Message: "File uploaded successfully."
        );

        // 4️⃣ Publish Event
        try
        {
            // Re-map to DocumentDto for the event payload
            var docDto = new DocumentDto(
                record.Id, 
                record.FileName, 
                record.FileSize, 
                record.ContentType, 
                record.UploadDate, 
                sasUrl);

            await _eventService.PublishDocumentUploadedAsync(docDto, ct);
        }
        catch (Exception ex)
        {
            // Don't fail the request if event publishing fails, just log it.
            _logger.LogError(ex, "Failed to publish upload event for {DocId}", record.Id);
        }

        return responseDto;
    }

    public async Task<IReadOnlyList<DocumentDto>> GetDocumentsAsync(
        string userId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        var records = await _cosmosDb.GetDocumentsByUserAsync(userId, ct);

        var tasks = records.Select(async r =>
        {
            var sasUrl = await _blobStorage.GenerateSasUrlAsync(r.BlobName, SasValidityPeriod, ct);
            return new DocumentDto(
                Id: r.Id,
                FileName: r.FileName,
                FileSize: r.FileSize,
                ContentType: r.ContentType,
                UploadDate: r.UploadDate,
                DownloadUrl: sasUrl
            );
        });

        var dtos = await Task.WhenAll(tasks);

        return dtos.AsReadOnly();
    }

    public async Task<IReadOnlyList<DocumentDto>> SearchDocumentsAsync(
        string userId,
        string searchTerm,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        if (string.IsNullOrWhiteSpace(searchTerm))
            throw new ArgumentException("Search term is required.");

        var records = await _cosmosDb.SearchDocumentsAsync(userId, searchTerm, ct);

        var tasks = records.Select(async r =>
        {
            var sasUrl = await _blobStorage.GenerateSasUrlAsync(r.BlobName, SasValidityPeriod, ct);
            return new DocumentDto(
                Id: r.Id,
                FileName: r.FileName,
                FileSize: r.FileSize,
                ContentType: r.ContentType,
                UploadDate: r.UploadDate,
                DownloadUrl: sasUrl
            );
        });

        var dtos = await Task.WhenAll(tasks);

        return dtos.AsReadOnly();
    }
}
