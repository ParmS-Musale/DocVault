import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpRequest, HttpEventType } from "@angular/common/http";
import { Observable, map, filter, tap } from "rxjs";
import { environment } from "../../environments/environment";
import {
	DocumentDto,
	UploadResponseDto,
	HealthDto,
} from "../models/document.model";

@Injectable({ providedIn: "root" })
export class DocumentService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiBaseUrl}/documents`;

	getDocuments(): Observable<DocumentDto[]> {
		console.log("📄 GET Documents URL:", this.baseUrl);
		return this.http.get<DocumentDto[]>(this.baseUrl);
	}

  searchDocuments(term: string): Observable<DocumentDto[]> {
    const q = term.trim();
    console.log("🔍 SEARCH Documents:", q);
    return this.http.get<DocumentDto[]>(`${this.baseUrl}/search`, {
      params: { q },
    });
  }

	uploadDocument(
		file: File,
	): Observable<{ progress: number; response?: UploadResponseDto }> {
		console.log("🚀 uploadDocument() called");
		console.log("🌐 Upload URL:", this.baseUrl);
		console.log("📦 File:", file.name, file.type, file.size);

		const formData = new FormData();
		formData.append("file", file, file.name);

		const req = new HttpRequest("POST", this.baseUrl, formData, {
			reportProgress: true,
		});

		console.log("🧾 HttpRequest created:", req);

		return this.http.request<UploadResponseDto>(req).pipe(
			// 🔥 MOST IMPORTANT DEBUG
			tap((event) => console.log("📡 HTTP EVENT:", event)),

			filter(
				(event) =>
					event.type === HttpEventType.UploadProgress ||
					event.type === HttpEventType.Response,
			),

			map((event) => {
				if (event.type === HttpEventType.UploadProgress) {
					const total = event.total ?? 1;
					const progress = Math.round((100 * event.loaded) / total);

					console.log(`📊 Upload Progress: ${progress}%`);

					return { progress };
				}

				// ✅ Final Response
				const response = (event as any).body as UploadResponseDto;

				console.log("✅ Upload Response:", response);

				return { progress: 100, response };
			}),
		);
	}

	checkHealth(): Observable<HealthDto> {
		console.log("❤️ Health Check URL:", `${this.baseUrl}/health`);
		return this.http.get<HealthDto>(`${this.baseUrl}/health`);
	}
}
