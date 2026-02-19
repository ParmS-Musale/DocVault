namespace DocVault.API.Configuration;

// Azure Blob Storage configuration options
public class AzureStorageOptions
{
    public const string SectionName = "AzureStorage";

    public string ConnectionString { get; set; } = string.Empty;
    public string ContainerName { get; set; } = "docvault-files";
}

// Azure Cosmos DB configuration options
public class CosmosDbOptions
{
    public const string SectionName = "CosmosDb";

    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "DocVaultDB";
    public string ContainerName { get; set; } = "Documents";
}

// Azure Event Grid configuration options
public class EventGridOptions
{
    public const string SectionName = "EventGrid";

    public string TopicEndpoint { get; set; } = string.Empty;
    public string TopicKey { get; set; } = string.Empty;
}

// Azure Service Bus configuration options
public class ServiceBusOptions
{
    public const string SectionName = "ServiceBus";

    public string ConnectionString { get; set; } = string.Empty;
    public string QueueName { get; set; } = "docvault-queue";
}
