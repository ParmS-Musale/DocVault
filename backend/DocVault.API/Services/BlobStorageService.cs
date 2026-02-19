using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using DocVault.API.Configuration;
using DocVault.API.Interfaces;
using Microsoft.Extensions.Options;

namespace DocVault.API.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _serviceClient;
    private readonly BlobContainerClient _containerClient;
    private readonly ILogger<BlobStorageService> _logger;

    private bool _containerEnsured;

    public BlobStorageService(
        IOptions<AzureStorageOptions> options,
        ILogger<BlobStorageService> logger)
    {
        _logger = logger;
        var opts = options.Value;

        if (string.IsNullOrWhiteSpace(opts.ConnectionString))
        {
            throw new ArgumentException("AzureStorage:ConnectionString is required.");
        }

        // Check if connection string is actually a URI (indicating Managed Identity usage)
        if (Uri.TryCreate(opts.ConnectionString, UriKind.Absolute, out var uri) && 
           (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
             _logger.LogInformation("Using Managed Identity (DefaultAzureCredential) with endpoint: {Endpoint}", opts.ConnectionString);
             _serviceClient = new BlobServiceClient(uri, new DefaultAzureCredential());
        }
        else
        {
             _logger.LogInformation("Using Connection String for Blob Storage.");
             _serviceClient = new BlobServiceClient(opts.ConnectionString);
        }

        _containerClient = _serviceClient.GetBlobContainerClient(opts.ContainerName);
    }

    private async Task EnsureContainerExistsAsync(CancellationToken ct = default)
    {
        if (_containerEnsured) return;
        await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: ct);
        _containerEnsured = true;
    }

    public async Task<(string BlobName, string BlobUrl)> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        IDictionary<string, string>? metadata = null,
        CancellationToken ct = default)
    {
        await EnsureContainerExistsAsync(ct);

        if (fileStream == null || fileStream.Length == 0)
            throw new ArgumentException("File stream is empty.");

        var blobName = $"{Guid.NewGuid():N}_{SanitizeFileName(fileName)}";
        var blobClient = _containerClient.GetBlobClient(blobName);

        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders
            {
                ContentType = contentType
            },
            Metadata = metadata
        };

        // Reset stream if seekable
        if (fileStream.CanSeek)
            fileStream.Position = 0;

        _logger.LogInformation(
            "Uploading blob {BlobName} ({ContentType})",
            blobName,
            contentType);

        await blobClient.UploadAsync(fileStream, uploadOptions, ct);

        return (blobName, blobClient.Uri.ToString());
    }

    private UserDelegationKey? _cachedUserDelegationKey;
    private readonly SemaphoreSlim _keyLock = new(1, 1);

    public async Task<string> GenerateSasUrlAsync(string blobName, TimeSpan validFor, CancellationToken ct = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        // Check if we can generate SAS directly (e.g. Account Key auth)
        if (blobClient.CanGenerateSasUri)
        {
            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = blobName,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.Add(validFor)
            };

            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            return blobClient.GenerateSasUri(sasBuilder).ToString();
        }

        // Fallback to User Delegation SAS (Managed Identity)
        try 
        {
            var key = await GetUserDelegationKeyAsync(ct);

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = blobName,
                Resource = "b",
                StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5), // Allow for clock skew
                ExpiresOn = DateTimeOffset.UtcNow.Add(validFor)
            };

            sasBuilder.SetPermissions(BlobSasPermissions.Read);
            
            var sasQueryParameters = sasBuilder.ToSasQueryParameters(key, _serviceClient.AccountName);

            var fullUri = new UriBuilder(blobClient.Uri)
            {
                Query = sasQueryParameters.ToString()
            };

            return fullUri.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate User Delegation SAS for blob {BlobName}", blobName);
            // Fallback to plain URL if SAS generation fails
             return blobClient.Uri.ToString();
        }
    }

    private async Task<UserDelegationKey> GetUserDelegationKeyAsync(CancellationToken ct)
    {
        // Double-check locking for thread safety
        if (_cachedUserDelegationKey != null && _cachedUserDelegationKey.SignedExpiresOn > DateTimeOffset.UtcNow.AddMinutes(5))
        {
            return _cachedUserDelegationKey;
        }

        await _keyLock.WaitAsync(ct);
        try
        {
            if (_cachedUserDelegationKey != null && _cachedUserDelegationKey.SignedExpiresOn > DateTimeOffset.UtcNow.AddMinutes(5))
            {
                return _cachedUserDelegationKey;
            }

            // Key valid for 1 hour
            var keyStart = DateTimeOffset.UtcNow.AddMinutes(-5);
            var keyEnd = DateTimeOffset.UtcNow.AddHours(1);
            
            _cachedUserDelegationKey = await _serviceClient.GetUserDelegationKeyAsync(keyStart, keyEnd, ct);
            return _cachedUserDelegationKey;
        }
        finally
        {
            _keyLock.Release();
        }
    }

    public async Task DeleteAsync(string blobName, CancellationToken ct = default)
    {
        await EnsureContainerExistsAsync(ct);

        var blobClient = _containerClient.GetBlobClient(blobName);

        var response = await blobClient.DeleteIfExistsAsync(cancellationToken: ct);

        if (response.Value)
            _logger.LogInformation("Deleted blob {BlobName}", blobName);
        else
            _logger.LogWarning("Blob {BlobName} not found", blobName);
    }

    // ── Helpers ─────────────────────────────────────────

    private static string SanitizeFileName(string fileName)
    {
        return Path.GetFileName(fileName)
                   .Replace(" ", "_");
    }
}
