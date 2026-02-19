namespace DocVault.API.DTOs;

// Response DTO returned for each document in the listing.
// Includes a short-lived SAS URL for direct blob download.

public record DocumentDto(
    string Id,
    string FileName,
    long FileSize,
    string ContentType,
    DateTime UploadDate,
    string DownloadUrl   // Blob SAS URL valid for 1 hour
);

// Response returned from POST /api/documents after a successful upload.

public record UploadResponseDto(
    string Id,
    string FileName,
    long FileSize,
    string ContentType,
    DateTime UploadDate,
    string DownloadUrl,
    string Message
);

// Standard error envelope returned on 4xx / 5xx responses.

public record ErrorResponseDto(
    string Error,
    string? Detail = null
);

// Health check response for GET /api/documents/health.

public record HealthDto(
    string Status,
    DateTime Timestamp,
    string Version
);
