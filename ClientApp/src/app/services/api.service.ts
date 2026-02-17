import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, @Inject(API_BASE_URL) private baseUrl: string) {}

  health(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/documents/health`);
  }

  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/api/documents/upload`, formData);
  }

  listDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/documents`);
  }

  getDocument(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/documents/${id}`);
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/documents/${id}`);
  }

  searchDocuments(q: string): Observable<any[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<any[]>(`${this.baseUrl}/api/documents/search`, { params });
  }
}
