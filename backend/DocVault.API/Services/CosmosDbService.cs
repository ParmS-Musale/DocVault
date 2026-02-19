using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using DocVault.API.Configuration;
using DocVault.API.Interfaces;
using DocVault.API.Models;
using Microsoft.Extensions.Options;

namespace DocVault.API.Services;

public class CosmosDbService : ICosmosDbService
{
    private readonly Container _container;
    private readonly ILogger<CosmosDbService> _logger;

    public CosmosDbService(
        IOptions<CosmosDbOptions> options,
        ILogger<CosmosDbService> logger)
    {
        _logger = logger;
        var opts = options.Value;

        var cosmosClient = new CosmosClient(
            opts.ConnectionString,
            new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            });

        // Create DB if not exists
        var database = cosmosClient
            .CreateDatabaseIfNotExistsAsync(opts.DatabaseName)
            .GetAwaiter()
            .GetResult()
            .Database;

        // Create Container if not exists
        _container = database
            .CreateContainerIfNotExistsAsync(
                new ContainerProperties(opts.ContainerName, "/userId"))
            .GetAwaiter()
            .GetResult()
            .Container;
    }

    public async Task<DocumentRecord> CreateDocumentAsync(
        DocumentRecord document,
        CancellationToken ct = default)
    {
        if (document == null)
            throw new ArgumentNullException(nameof(document));

        if (string.IsNullOrWhiteSpace(document.UserId))
            throw new ArgumentException("UserId (partition key) is required.");

        _logger.LogInformation("Creating Cosmos document {DocId}", document.Id);

        try
        {
            var response = await _container.CreateItemAsync(
                document,
                new PartitionKey(document.UserId),
                cancellationToken: ct);

            return response.Resource;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex,
                "Failed to create Cosmos document {DocId}", document.Id);
            throw;
        }
    }

    public async Task<IReadOnlyList<DocumentRecord>> GetDocumentsByUserAsync(
        string userId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        _logger.LogInformation("Querying documents for user {UserId}", userId);

        var query = _container
            .GetItemLinqQueryable<DocumentRecord>(
                requestOptions: new QueryRequestOptions
                {
                    PartitionKey = new PartitionKey(userId)
                })
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.UploadDate)
            .ToFeedIterator();

        var results = new List<DocumentRecord>();

        while (query.HasMoreResults)
        {
            var batch = await query.ReadNextAsync(ct);
            results.AddRange(batch);
        }

        return results.AsReadOnly();
    }

    public async Task<DocumentRecord?> GetDocumentAsync(
        string id,
        string userId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Document id is required.");

        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        try
        {
            var response = await _container.ReadItemAsync<DocumentRecord>(
                id,
                new PartitionKey(userId),
                cancellationToken: ct);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning(
                "Cosmos document {DocId} not found for user {UserId}",
                id,
                userId);

            return null;
        }
    }

    public async Task DeleteDocumentAsync(
        string id,
        string userId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Document id is required.");

        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        try
        {
            await _container.DeleteItemAsync<DocumentRecord>(
                id,
                new PartitionKey(userId),
                cancellationToken: ct);

            _logger.LogInformation("Deleted Cosmos document {DocId}", id);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex,
                "Failed to delete Cosmos document {DocId}", id);
            throw;
        }
    }

    public async Task<IReadOnlyList<DocumentRecord>> SearchDocumentsAsync(
        string userId,
        string searchTerm,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.");

        if (string.IsNullOrWhiteSpace(searchTerm))
            throw new ArgumentException("Search term is required.");

        var term = searchTerm.Trim().ToLowerInvariant();

        _logger.LogInformation(
            "Searching documents for user {UserId} with term {Term}",
            userId,
            term);

        var queryable = _container
            .GetItemLinqQueryable<DocumentRecord>(
                requestOptions: new QueryRequestOptions
                {
                    PartitionKey = new PartitionKey(userId)
                })
            .Where(d => d.UserId == userId);

        // Cosmos LINQ supports string.Contains; normalize client-side for case-insensitive match.
        var query = queryable
            .Where(d =>
                d.FileName.ToLower().Contains(term) ||
                d.ContentType.ToLower().Contains(term))
            .OrderByDescending(d => d.UploadDate)
            .ToFeedIterator();

        var results = new List<DocumentRecord>();

        while (query.HasMoreResults)
        {
            var batch = await query.ReadNextAsync(ct);
            results.AddRange(batch);
        }

        return results.AsReadOnly();
    }
}
