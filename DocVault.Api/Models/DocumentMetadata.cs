using Newtonsoft.Json;

public class DocumentMetadata
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("userId")]
    public string UserId { get; set; }

    public string FileName { get; set; }
    public string BlobName { get; set; }
    public string BlobUrl { get; set; }

    public string ContentType { get; set; }
    public long SizeBytes { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public string Status { get; set; } = "pending";
    public string[] Tags { get; set; } = [];
    public string? Excerpt { get; set; }
    public string? ThumbnailUrl { get; set; }

    public bool IsDeleted { get; set; } = false;
}
