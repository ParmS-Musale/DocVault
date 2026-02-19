using Newtonsoft.Json;
using System;

namespace DocVault.Functions.Models
{
    public class DocumentRecord
    {
        [JsonProperty("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonProperty("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonProperty("fileSize")]
        public long FileSize { get; set; }

        [JsonProperty("contentType")]
        public string ContentType { get; set; } = string.Empty;

        [JsonProperty("uploadDate")]
        public DateTime UploadDate { get; set; } = DateTime.UtcNow;

        [JsonProperty("blobUrl")]
        public string BlobUrl { get; set; } = string.Empty;

        [JsonProperty("blobName")]
        public string BlobName { get; set; } = string.Empty;

        [JsonProperty("userId")]
        public string UserId { get; set; } = "anonymous";

        [JsonProperty("isProcessed")]
        public bool IsProcessed { get; set; }

        [JsonProperty("extractedText")]
        public string? ExtractedText { get; set; }

        [JsonProperty("thumbnailUrl")]
        public string? ThumbnailUrl { get; set; }
    }
}
