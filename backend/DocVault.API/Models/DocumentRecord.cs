using Newtonsoft.Json;

namespace DocVault.API.Models;

// Cosmos DB document model (partition key: /userId)
public class DocumentRecord
{
    // Unique document identifier
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    // Original uploaded file name
    [JsonProperty("fileName")]
    public string FileName { get; set; } = string.Empty;

    // File size in bytes
    [JsonProperty("fileSize")]
    public long FileSize { get; set; }

    // MIME content type
    [JsonProperty("contentType")]
    public string ContentType { get; set; } = string.Empty;

    // UTC upload timestamp
    [JsonProperty("uploadDate")]
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    // Full Blob Storage URL
    [JsonProperty("blobUrl")]
    public string BlobUrl { get; set; } = string.Empty;

    // Blob name used for SAS regeneration
    [JsonProperty("blobName")]
    public string BlobName { get; set; } = string.Empty;

    // Cosmos DB partition key (user identifier)
    [JsonProperty("userId")]
    public string UserId { get; set; } = "anonymous";

    // Processing status flag
    [JsonProperty("isProcessed")]
    public bool IsProcessed { get; set; }

    // Extracted document text
    [JsonProperty("extractedText")]
    public string? ExtractedText { get; set; }
}
