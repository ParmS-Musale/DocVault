using DocVault.API.DTOs;
using DocVault.API.Interfaces;
using DocVault.API.Models;
using Microsoft.Extensions.Configuration;

namespace DocVault.API.Services;

public class DocumentService : IDocumentService
{
    private static readonly TimeSpan SasValidityPeriod = TimeSpan.FromHours(1);

    private readonly IBlobStorageService _blobStorage;
    private readonly ICosmosDbService _cosmosDb;
    private readonly ILogger<DocumentService> _logger;
    private readonly Azure.Messaging.EventGrid.EventGridPublisherClient? _eventGridPublisher;
    private readonly Azure.Messaging.ServiceBus.ServiceBusClient? _serviceBusClient;
    private readonly IConfiguration _configuration;

    public DocumentService(
        IBlobStorageService blobStorage,
        ICosmosDbService cosmosDb,
        ILogger<DocumentService> logger,
        IConfiguration configuration,
        Azure.Messaging.EventGrid.EventGridPublisherClient? eventGridPublisher = null,
        Azure.Messaging.ServiceBus.ServiceBusClient? serviceBusClient = null)
    {
        _blobStorage = blobStorage;
        _cosmosDb = cosmosDb;
        _logger = logger;
        _configuration = configuration;
        _eventGridPublisher = eventGridPublisher;
        _serviceBusClient = serviceBusClient;
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

        // 3️⃣ Event Grid Notification
        if (_eventGridPublisher != null)
        {
            try
            {
                var evt = new Azure.Messaging.EventGrid.EventGridEvent(
                    subject: $"docs/uploaded/{userId}/{record.Id}",
                    eventType: "DocVault.DocumentUploaded",
                    dataVersion: "1.0",
                    data: new
                    {
                        record.Id,
                        record.FileName,
                        record.UserId
                    });

                await _eventGridPublisher.SendEventAsync(evt, ct);

                _logger.LogInformation(
                    "Published DocumentUploaded event to Event Grid.");
            }
            catch (Exception ex)
            {
                // Non-blocking failure
                _logger.LogError(ex,
                    "Failed to publish Event Grid event.");
            }
        }

        // 4️⃣ Service Bus - Heavy Processing
        if (_serviceBusClient != null &&
            (fileSize > 10 * 1024 * 1024 ||
             contentType == "application/pdf"))
        {
            try
            {
                var queueName =
                    _configuration["ServiceBus:QueueName"]
                    ?? "document-processing";

                var sender =
                    _serviceBusClient.CreateSender(queueName);

                var payload = System.Text.Json.JsonSerializer.Serialize(
                    new
                    {
                        record.Id,
                        record.UserId,
                        record.BlobName
                    });

                var message =
                    new Azure.Messaging.ServiceBus.ServiceBusMessage(payload);

                await sender.SendMessageAsync(message, ct);

                _logger.LogInformation(
                    "Sent message to Service Bus queue.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to send Service Bus message.");
            }
        }

        // 5️⃣ Generate SAS URL
        var sasUrl =
            _blobStorage.GenerateSasUrl(blobName, SasValidityPeriod);

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

        var records =
            await _cosmosDb.GetDocumentsByUserAsync(userId, ct);

        return MapRecords(records);   // ✅ FIXED
    }

    public async Task<IReadOnlyList<DocumentDto>> SearchDocumentsAsync(
        string userId,
        string searchTerm,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        var records =
            await _cosmosDb.GetDocumentsByUserAsync(userId, ct);

        var matches = records.Where(r =>
            (r.FileName?.Contains(searchTerm,
                StringComparison.OrdinalIgnoreCase) ?? false)
            ||
            (r.ExtractedText?.Contains(searchTerm,
                StringComparison.OrdinalIgnoreCase) ?? false)
        ).ToList();

        return MapRecords(matches);
    }

    private IReadOnlyList<DocumentDto> MapRecords(
        IEnumerable<DocumentRecord> records)
    {
        return records
            .Select(r => new DocumentDto(
                Id: r.Id,
                FileName: r.FileName,
                FileSize: r.FileSize,
                ContentType: r.ContentType,
                UploadDate: r.UploadDate,
                DownloadUrl: _blobStorage.GenerateSasUrl(
                    r.BlobName, SasValidityPeriod),
                ThumbnailUrl: r.ThumbnailUrl,
                IsProcessed: r.IsProcessed,
                Snippet: r.ExtractedText?.Length > 100
                    ? r.ExtractedText[..100] + "..."
                    : r.ExtractedText
            ))
            .ToList()
            .AsReadOnly();
    }
}
