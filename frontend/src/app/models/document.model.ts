/**
 * Represents a document record as returned by the API.
 */
export interface DocumentDto {
	id: string;
	fileName: string;
	fileSize: number;
	contentType: string;
	uploadDate: string; // ISO 8601 UTC string from backend
	downloadUrl: string; // SAS URL valid for ~1 hour
}

/**
 * Response from POST /api/documents after a successful upload.
 */
export interface UploadResponseDto extends DocumentDto {
	message: string;
}

/**
 * Wrapper for API error responses (4xx/5xx).
 */
export interface ErrorResponseDto {
	error: string;
	detail?: string;
}

/**
 * Health check response from GET /api/documents/health.
 */
export interface HealthDto {
	status: string;
	timestamp: string;
	version: string;
}

/**
 * Internal upload state managed by UploadComponent.
 */
export interface UploadState {
	file: File;
	progress: number; // 0–100
	status: "pending" | "uploading" | "success" | "error";
	errorMessage?: string;
	result?: UploadResponseDto;
}
