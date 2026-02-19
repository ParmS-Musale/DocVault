using DocVault.API.DTOs;
using DocVault.API.Models;

namespace DocVault.API.Interfaces;


// Abstraction over Azure Blob Storage operations.

public interface IBlobStorageService
{
    
    // Uploads a file stream to Azure Blob Storage.
    // Returns the blob name and permanent (non-SAS) URL.
    Task<(string BlobName, string BlobUrl)> UploadAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        IDictionary<string, string>? metadata = null,
        CancellationToken ct = default);

    // Generates a time-limited SAS download URL for the given blob.
  
    // Generates a time-limited SAS download URL for the given blob.
    Task<string> GenerateSasUrlAsync(string blobName, TimeSpan validFor, CancellationToken ct = default);


  // Deletes a blob permanently from storage.
    Task DeleteAsync(string blobName, CancellationToken ct = default);
}

// Abstraction over Azure Cosmos DB document persistence.
public interface ICosmosDbService
{
    //Creates a document record in Cosmos DB.
    Task<DocumentRecord> CreateDocumentAsync(DocumentRecord document, CancellationToken ct = default);

    //Retrieves all documents for a given user.
    Task<IReadOnlyList<DocumentRecord>> GetDocumentsByUserAsync(string userId, CancellationToken ct = default);

    // Retrieves a single document by its ID and partition key.
    Task<DocumentRecord?> GetDocumentAsync(string id, string userId, CancellationToken ct = default);

    // Deletes a document record from Cosmos DB.
    Task DeleteDocumentAsync(string id, string userId, CancellationToken ct = default);

    // Performs a case-insensitive search over a user's documents.
    Task<IReadOnlyList<DocumentRecord>> SearchDocumentsAsync(string userId, string searchTerm, CancellationToken ct = default);
}

 
// Orchestrates blob + Cosmos DB operations for the Documents controller.

public interface IDocumentService
{
    Task<UploadResponseDto> UploadDocumentAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        long fileSize,
        string userId,
        CancellationToken ct = default);

    Task<IReadOnlyList<DocumentDto>> GetDocumentsAsync(string userId, CancellationToken ct = default);

    Task<IReadOnlyList<DocumentDto>> SearchDocumentsAsync(string userId, string searchTerm, CancellationToken ct = default);
}

// Abstraction for publishing events (Event Grid / Service Bus).
public interface IEventService
{
    Task PublishDocumentUploadedAsync(DocumentDto document, CancellationToken ct = default);
}
