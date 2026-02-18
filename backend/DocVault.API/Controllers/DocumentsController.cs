using DocVault.API.DTOs;
using DocVault.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DocVault.API.Controllers;

// Controller for document upload operations.
// Currently exposes ONLY POST /api/documents

[ApiController]
[Route("api/documents")]
[Produces("application/json")]
public class DocumentsController : ControllerBase
{
    // Max upload size: 100 MB
    private const long MaxFileSizeBytes = 100 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png"
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

    // ── POST /api/documents ─────────────────────────────────────────────────────

    [HttpPost]
    [RequestSizeLimit(MaxFileSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileSizeBytes)]
    [ProducesResponseType(typeof(UploadResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponseDto), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UploadDocument(
        IFormFile file,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ErrorResponseDto("File is required."));

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new ErrorResponseDto(
                $"Unsupported content type: {file.ContentType}"
            ));

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

            return Created(string.Empty, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Upload failed");
            return StatusCode(500,
                new ErrorResponseDto("Failed to upload document.", ex.Message));
        }
    }

    // ── Helper ──────────────────────────────────────────────────────────────────

    private string GetUserId()
    {
        return "anonymous"; // replace later with JWT claim
    }
}
