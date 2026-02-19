using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using DocVault.Functions.Models;
using System.Linq;
using System.Collections.Generic;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using Azure.Storage.Blobs.Models;

namespace DocVault.Functions
{
    public class BlobProcessingFunction
    {
        private readonly ILogger _logger;
        private readonly CosmosClient _cosmosClient;

        public BlobProcessingFunction(ILoggerFactory loggerFactory, CosmosClient cosmosClient)
        {
            _logger = loggerFactory.CreateLogger<BlobProcessingFunction>();
            _cosmosClient = cosmosClient;
        }

        [Function("BlobProcessingFunction")]
        public async Task RunAsync(
            [BlobTrigger("uploads/{name}", Connection = "AzureStorage:ConnectionString")] Stream stream,
            [BlobInput("thumbnails/{name}", Connection = "AzureStorage:ConnectionString")] BlockBlobClient thumbnailBlob,
            string name,
            Dictionary<string, string> metadata)
        {
            _logger.LogInformation($"C# Blob trigger function Processed blob\n Name: {name} \n Size: {stream.Length} Bytes");

            if (metadata == null || !metadata.TryGetValue("userId", out var userId))
            {
                _logger.LogWarning($"Blob {name} is missing 'userId' metadata. Skipping processing.");
                return;
            }

            try
            {
                // 1. Generate Thumbnail if Image
                if (IsImage(name))
                {
                    _logger.LogInformation($"Generating thumbnail for {name}...");
                    using var image = await Image.LoadAsync(stream);
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = new Size(150, 150),
                        Mode = ResizeMode.Max
                    }));

                    using var outputStream = new MemoryStream();
                    await image.SaveAsJpegAsync(outputStream);
                    outputStream.Position = 0;

                    await thumbnailBlob.UploadAsync(outputStream, new BlobUploadOptions
                    {
                        HttpHeaders = new BlobHttpHeaders { ContentType = "image/jpeg" }
                    });
                     _logger.LogInformation($"Thumbnail generated and uploaded to thumbnails/{name}");
                }

                // 2. Update Cosmos DB Metadata
                var databaseName = Environment.GetEnvironmentVariable("CosmosDb:DatabaseName") ?? "docvault-db";
                var containerName = Environment.GetEnvironmentVariable("CosmosDb:ContainerName") ?? "documents";
                var container = _cosmosClient.GetContainer(databaseName, containerName);

                // Find the document record
                var query = container.GetItemLinqQueryable<DocumentRecord>(
                        requestOptions: new QueryRequestOptions
                        {
                            PartitionKey = new PartitionKey(userId)
                        })
                    .Where(d => d.BlobName == name)
                    .ToFeedIterator();

                DocumentRecord? document = null;
                while (query.HasMoreResults)
                {
                    var response = await query.ReadNextAsync();
                    document = response.FirstOrDefault();
                    if (document != null) break;
                }

                if (document != null)
                {
                    document.IsProcessed = true;
                    document.ExtractedText = $"Processed at {DateTime.UtcNow}. Content preview: " + (stream.Length > 20 ? "Valid content" : "Empty");
                    
                    if (IsImage(name))
                    {
                        document.ThumbnailUrl = thumbnailBlob.Uri.ToString();
                    }

                    await container.ReplaceItemAsync(
                        document, 
                        document.Id, 
                        new PartitionKey(userId));

                    _logger.LogInformation($"Updated Cosmos DB document {document.Id} for blob {name}");
                }
                else
                {
                    _logger.LogWarning($"Document record not found in Cosmos DB for blob {name} and userId {userId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing blob {name}");
                throw;
            }
        }

        private static bool IsImage(string name)
        {
            var ext = Path.GetExtension(name).ToLowerInvariant();
            return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".bmp";
        }
    }
}
