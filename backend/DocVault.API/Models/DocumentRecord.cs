using Newtonsoft.Json;

namespace DocVault.API.Models;

/// <summary>
/// Represents a document record persisted in Azure Cosmos DB.
/// The partition key is /userId for efficient per-user queries.
/// </summary>
public class DocumentRecord
{
    /// <summary>Unique document identifier (GUID).</summary>
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Original file name uploaded by the user.</summary>
    [JsonProperty("fileName")]
    public string FileName { get; set; } = string.Empty;

    /// <summary>File size in bytes.</summary>
    [JsonProperty("fileSize")]
    public long FileSize { get; set; }

    /// <summary>MIME content type of the uploaded file.</summary>
    [JsonProperty("contentType")]
    public string ContentType { get; set; } = string.Empty;

    /// <summary>UTC timestamp when the file was uploaded.</summary>
    [JsonProperty("uploadDate")]
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    /// <summary>Full URL of the blob in Azure Blob Storage.</summary>
    [JsonProperty("blobUrl")]
    public string BlobUrl { get; set; } = string.Empty;

    /// <summary>
    /// Name of the blob within the container.
    /// Stored separately so we can regenerate SAS URLs later.
    /// </summary>
    [JsonProperty("blobName")]
    public string BlobName { get; set; } = string.Empty;

    /// <summary>
    /// Partition key – identifies the owning user.
    /// Defaults to "anonymous" when auth is not enabled.
    /// </summary>
    [JsonProperty("userId")]
    public string UserId { get; set; } = "anonymous";

    [JsonProperty("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }

    [JsonProperty("isProcessed")]
    public bool IsProcessed { get; set; }

    [JsonProperty("extractedText")]
    public string? ExtractedText { get; set; }
}
