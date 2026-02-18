using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos;
using Microsoft.AspNetCore.Mvc;

namespace DocVault.Api.Controllers
{
    [ApiController]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        private readonly BlobServiceClient _blobClient;
        private readonly CosmosClient _cosmosClient;
        private readonly IConfiguration _config;

        public TestController(
            BlobServiceClient blobClient,
            CosmosClient cosmosClient,
            IConfiguration config)
        {
            _blobClient = blobClient;
            _cosmosClient = cosmosClient;
            _config = config;
        }

        [HttpGet("connections")]
        public async Task<IActionResult> CheckConnections()
        {
            // Blob test
            var containers = new List<string>();
            await foreach (var container in _blobClient.GetBlobContainersAsync())
            {
                containers.Add(container.Name);
            }

            // Cosmos test
            var dbName = _config["CosmosDb:DatabaseName"];
            var containerName = _config["CosmosDb:ContainerName"];

            var dbResponse =
                await _cosmosClient.CreateDatabaseIfNotExistsAsync(dbName);

            var containerResponse =
                await dbResponse.Database
                    .CreateContainerIfNotExistsAsync(
                        containerName,
                        "/userId");

            return Ok(new
            {
                BlobContainers = containers,
                CosmosDatabase = dbResponse.Database.Id,
                CosmosContainer = containerResponse.Container.Id
            });
        }
    }
}
