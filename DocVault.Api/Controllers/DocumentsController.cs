using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;

namespace DocVault.Api.Controllers
{
    [ApiController]
    [Route("api/documents")]   // 🔥 Explicit route (no [controller] ambiguity)
    public class DocumentsController : ControllerBase
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly CosmosClient _cosmosClient;
        private readonly IConfiguration _configuration;

        public DocumentsController(
            BlobServiceClient blobServiceClient,
            CosmosClient cosmosClient,
            IConfiguration configuration)
        {
            _blobServiceClient = blobServiceClient;
            _cosmosClient = cosmosClient;
            _configuration = configuration;
        }


        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDocument(
            [FromForm(Name = "file")] IFormFile file,
            [FromForm(Name = "tags")] string? tags)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is required.");

            var userId = "temp-user";

            var containerClient =
                _blobServiceClient.GetBlobContainerClient(
                    _configuration["AzureStorage:ContainerName"]);

            await containerClient.CreateIfNotExistsAsync();

            var blobName = $"{userId}/{Guid.NewGuid()}-{file.FileName}";
            var blobClient = containerClient.GetBlobClient(blobName);

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: false);

            var cosmosContainer =
                _cosmosClient.GetContainer(
                    _configuration["CosmosDb:DatabaseName"],
                    _configuration["CosmosDb:ContainerName"]);

            var metadata = new DocumentMetadata
            {
                UserId = userId,
                FileName = file.FileName,
                BlobName = blobName,
                BlobUrl = blobClient.Uri.ToString(),
                ContentType = file.ContentType,
                SizeBytes = file.Length,
                Status = "pending",
                Tags = string.IsNullOrWhiteSpace(tags)
                    ? Array.Empty<string>()
                    : tags.Split(',', StringSplitOptions.RemoveEmptyEntries)
            };

            await cosmosContainer.CreateItemAsync(
                metadata,
                new PartitionKey(userId));

            return Ok(metadata);
        }

    }
}
