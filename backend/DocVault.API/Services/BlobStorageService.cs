using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using DocVault.API.Configuration;
using DocVault.API.Interfaces;
using Microsoft.Extensions.Options;

namespace DocVault.API.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _containerClient;
    private readonly ILogger<BlobStorageService> _logger;

    private bool _containerEnsured;

    public BlobStorageService(
        IOptions<AzureStorageOptions> options,
        ILogger<BlobStorageService> logger)
    {
        _logger = logger;
        var opts = options.Value;

        var serviceClient = new BlobServiceClient(opts.ConnectionString);
        _containerClient = serviceClient.GetBlobContainerClient(opts.ContainerName);
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
            }
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

    public string GenerateSasUrl(string blobName, TimeSpan validFor)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        if (!blobClient.CanGenerateSasUri)
        {
            _logger.LogWarning(
                "Cannot generate SAS URI for blob {BlobName}. Returning plain URL.",
                blobName);

            return blobClient.Uri.ToString();
        }

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
