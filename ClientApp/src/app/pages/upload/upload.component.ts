import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';


@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrls: ['./upload.css'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
})
export class UploadComponent {
  selectedFile: File | null = null;
  uploadResponse: any;
  isUploading = false;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadFile() {
    if (!this.selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.isUploading = true;

    // Route upload request through Azure API Management (APIM) gateway
    this.http.post(
      `${environment.apiBaseUrl}/documents/upload`,
      formData
    ).subscribe({
      next: (res) => {
        this.uploadResponse = res;
        this.isUploading = false;
      },
      error: (err) => {
        console.error(err);
        alert('Upload failed');
        this.isUploading = false;
      },
    });
  }
}
