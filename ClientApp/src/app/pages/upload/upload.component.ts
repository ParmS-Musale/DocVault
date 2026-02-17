import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrls: ['./upload.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
})
export class UploadComponent {
  selectedFile: File | null = null;
  uploadResponse: any;
  isUploading = false;
  successMessage = '';

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.successMessage = '';
  }

  uploadFile() {
    if (!this.selectedFile) {
      alert('Please select a file');
      return;
    }

    this.isUploading = true;

    this.api.uploadDocument(this.selectedFile).subscribe({
      next: (res) => {
        this.uploadResponse = res;
        this.isUploading = false;
        this.successMessage = 'File uploaded successfully';
        this.snackBar.open('File uploaded successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Upload failed', 'Close', { duration: 4000 });
        this.isUploading = false;
      },
    });
  }
}
