import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpEventType } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { DocumentDto, UploadResponseDto, HealthDto } from '../models/document.model';

/**
 * Service that wraps all DocVault REST API calls.
 * Provided at root so it is a singleton across the app.
 */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/documents`;

  /**
   * Fetches the full document list for the current user.
   * Includes freshly-generated SAS download URLs.
   */
  getDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(this.baseUrl);
  }

  /**
   * Uploads a file and reports upload progress.
   * Emits progress percentage (0–100) and finally the server response.
   */
  uploadDocument(file: File): Observable<{ progress: number; response?: UploadResponseDto }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const req = new HttpRequest('POST', this.baseUrl, formData, {
      reportProgress: true
    });

    return this.http.request<UploadResponseDto>(req).pipe(
      filter(event =>
        event.type === HttpEventType.UploadProgress ||
        event.type === HttpEventType.Response
      ),
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 1;
          return { progress: Math.round((100 * event.loaded) / total) };
        }
        // HttpEventType.Response
        const response = (event as any).body as UploadResponseDto;
        return { progress: 100, response };
      })
    );
  }

  /**
   * Checks API health.
   */
  checkHealth(): Observable<HealthDto> {
    return this.http.get<HealthDto>(`${this.baseUrl}/health`);
  }
}
