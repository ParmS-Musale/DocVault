using DocVault.API.DTOs;
using DocVault.API.Interfaces;
using DocVault.API.Models;

namespace DocVault.API.Services;

public class DocumentService : IDocumentService
{
    private static readonly TimeSpan SasValidityPeriod = TimeSpan.FromHours(1);

    private readonly IBlobStorageService _blobStorage;
    private readonly ICosmosDbService _cosmosDb;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(
        IBlobStorageService blobStorage,
        ICosmosDbService cosmosDb,
        ILogger<DocumentService> logger)
    {
        _blobStorage = blobStorage;
        _cosmosDb = cosmosDb;
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
        var (blobName, blobUrl) = await _blobStorage.UploadAsync(
            fileStream, fileName, contentType, ct);

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
        var sasUrl = _blobStorage.GenerateSasUrl(blobName, SasValidityPeriod);

        return new UploadResponseDto(
            Id: record.Id,
            FileName: record.FileName,
            FileSize: record.FileSize,
            ContentType: record.ContentType,
            UploadDate: record.UploadDate,
            DownloadUrl: sasUrl,
            Message: "File uploaded successfully."
        );
    }

    public async Task<IReadOnlyList<DocumentDto>> GetDocumentsAsync(
        string userId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        var records = await _cosmosDb.GetDocumentsByUserAsync(userId, ct);

        return records
            .Select(r => new DocumentDto(
                Id: r.Id,
                FileName: r.FileName,
                FileSize: r.FileSize,
                ContentType: r.ContentType,
                UploadDate: r.UploadDate,
                DownloadUrl: _blobStorage.GenerateSasUrl(r.BlobName, SasValidityPeriod)
            ))
            .ToList()
            .AsReadOnly();
    }
}
