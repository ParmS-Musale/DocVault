namespace DocVault.API.Configuration;

/// <summary>
/// Strongly-typed options for Azure Blob Storage.
/// Bound from appsettings.json section "AzureStorage".
/// </summary>
public class AzureStorageOptions
{
    public const string SectionName = "AzureStorage";

    /// <summary>Azure Storage Account connection string.</summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>Name of the blob container to store documents.</summary>
    public string ContainerName { get; set; } = "docvault-files";
}

/// <summary>
/// Strongly-typed options for Azure Cosmos DB.
/// Bound from appsettings.json section "CosmosDb".
/// </summary>
public class CosmosDbOptions
{
    public const string SectionName = "CosmosDb";

    /// <summary>Cosmos DB account connection string.</summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>Name of the Cosmos DB database.</summary>
    public string DatabaseName { get; set; } = "DocVaultDB";

    /// <summary>Name of the Cosmos DB container for documents.</summary>
    public string ContainerName { get; set; } = "Documents";
}
