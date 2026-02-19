using DocVault.API.DTOs;
using DocVault.API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;


namespace DocVault.API.Controllers;

[Authorize]
[ApiController]
[Route("api/documents")]
[Produces("application/json")]
public class DocumentsController : ControllerBase
{
    // Max upload size enforced at the controller level: 100 MB
    private const long MaxFileSizeBytes = 100 * 1024 * 1024;

    // Allowed MIME types – extend as needed
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
        "text/csv"
    };

    private readonly IDocumentService _documentService;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IDocumentService documentService,
        ILogger<DocumentsController> logger)
    {
        _documentService = documentService;
        _logger = logger;
    }

    // ── GET /api/documents/health ───────────────────────────────────────────────

    [HttpGet("health")]
    [ProducesResponseType(typeof(HealthDto), StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok(new HealthDto(
            Status: "Healthy",
            Timestamp: DateTime.UtcNow,
            Version: "1.0.0"
        ));
    }

    // ── GET /api/documents ─────────────────────────────────────────────────────

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDocuments(CancellationToken ct)
    {
        try
        {
            var userId = GetUserId();

            var documents = await _documentService.GetDocumentsAsync(userId, ct);
            return Ok(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving documents");
            return StatusCode(500, new ErrorResponseDto("Failed to retrieve documents.", ex.Message));
        }
    }

    // ── GET /api/documents/search?q=term ───────────────────────────────────────

    [HttpGet("search")]
    [ProducesResponseType(typeof(IReadOnlyList<DocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SearchDocuments(
        [FromQuery(Name = "q")] string? query,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new ErrorResponseDto("Search query parameter 'q' is required."));
        }

        // Small guardrail against accidental empty / 1-char searches.
        if (query.Trim().Length < 2)
        {
            return BadRequest(new ErrorResponseDto("Search term must be at least 2 characters long."));
        }

        try
        {
            var userId = GetUserId();
            var documents = await _documentService.SearchDocumentsAsync(userId, query, ct);
            return Ok(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching documents with query {Query}", query);
            return StatusCode(500, new ErrorResponseDto("Failed to search documents.", ex.Message));
        }
    }

    // ── POST /api/documents ────────────────────────────────────────────────────

    [HttpPost]
    [RequestSizeLimit(MaxFileSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileSizeBytes)]
    [ProducesResponseType(typeof(UploadResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status413RequestEntityTooLarge)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UploadDocument(
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new ErrorResponseDto("No file provided or file is empty."));

        if (file.Length > MaxFileSizeBytes)
            return StatusCode(413, new ErrorResponseDto(
                $"File exceeds the maximum allowed size of {MaxFileSizeBytes / 1024 / 1024} MB."));

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new ErrorResponseDto(
                $"Content type '{file.ContentType}' is not allowed.",
                $"Allowed types: {string.Join(", ", AllowedContentTypes)}"));

        try
        {
            var userId = GetUserId();

            await using var stream = file.OpenReadStream();

            var result = await _documentService.UploadDocumentAsync(
                stream,
                file.FileName,
                file.ContentType,
                file.Length,
                userId,
                ct);

            return CreatedAtAction(
                nameof(GetDocuments),
                new { id = result.Id },
                result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document {FileName}", file.FileName);
            return StatusCode(500, new ErrorResponseDto("Failed to upload the document.", ex.Message));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private string GetUserId()
    {
        // For development/testing without a full token, you might want a fallback,
        // but for production, we expect a valid claim.
        
        // 1. Try to get the "oid" (Object ID) claim standard in Azure AD v2 tokens
        var oid = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                  ?? User.FindFirst("oid")?.Value;

        if (!string.IsNullOrEmpty(oid))
            return oid;

        // 2. Fallback to "sub" (Subject) if oid is missing
        var sub = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value
                  ?? User.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(sub))
            return sub;

        // 3. Fallback to Name if available
        if (User.Identity?.Name != null)
            return User.Identity.Name;

        // 4. If strict auth is required, throw. 
        // For now, if we are in [Authorize], we should have *something*, but if not:
        throw new UnauthorizedAccessException("User ID claim not found in token.");
    }
}