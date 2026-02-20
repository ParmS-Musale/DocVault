import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocumentService } from '../../services/document.service';

interface UploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  result?: any;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="upload-page">
      <div class="header-section">
        <h1>Upload Documents</h1>
        <p>Add new files to your secure vault</p>
      </div>

      <div 
        class="drop-zone"
        [class.dragging]="isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input #fileInput type="file" multiple class="hidden-input" (change)="onFileSelected($event)">
        
        <div class="drop-content">
          <div class="icon-circle">
            <mat-icon>{{ isDragging() ? 'file_download' : 'cloud_upload' }}</mat-icon>
          </div>
          <h3>{{ isDragging() ? 'Drop files now' : 'Click or drag files to upload' }}</h3>
          <p>SVG, PNG, JPG or GIF (max. 800x400px)</p>
        </div>
      </div>

      @if (uploads().length > 0) {
        <div class="upload-queue">
          <div class="queue-header">
            <h3>Uploading {{ uploads().length }} files</h3>
            <button mat-button color="warn" (click)="clearCompleted()">Clear Completed</button>
          </div>

          <div class="queue-list">
            @for (upload of uploads(); track upload.file.name) {
              <div class="upload-item">
                <div class="file-icon-wrapper">
                  <mat-icon>{{ getFileIcon(upload.file) }}</mat-icon>
                </div>
                
                <div class="file-details">
                  <div class="file-header">
                    <span class="file-name">{{ upload.file.name }}</span>
                    <span class="file-size">{{ formatSize(upload.file.size) }}</span>
                  </div>
                  
                  <div class="progress-section">
                    <mat-progress-bar 
                      [mode]="upload.status === 'uploading' ? 'determinate' : 'determinate'" 
                      [value]="upload.progress"
                      [class.success]="upload.status === 'success'"
                      [class.error]="upload.status === 'error'"
                    ></mat-progress-bar>
                  </div>

                  <div class="status-msg">
                    @if (upload.status === 'uploading') { <span>Uploading... {{ upload.progress }}%</span> }
                    @if (upload.status === 'success') { <span class="text-success">Completed</span> }
                    @if (upload.status === 'error') { <span class="text-error">Error: {{ upload.errorMessage }}</span> }
                  </div>
                </div>

                <div class="action-icon">
                  @if (upload.status === 'success') { <mat-icon class="text-success">check_circle</mat-icon> }
                  @if (upload.status === 'error') { <mat-icon class="text-error">error</mat-icon> }
                </div>
              </div>
            }
          </div>
        </div>
      }
      
      <div class="back-link">
        <a routerLink="/documents" mat-button>
          <mat-icon>arrow_back</mat-icon>
          Back to Documents
        </a>
      </div>
    </div>
  `,
  styles: [`
    .upload-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header-section {
      text-align: center;
      margin-bottom: 3rem;
    }
    .header-section h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .header-section p { color: var(--text-secondary); }

    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      padding: 4rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--bg-surface);
      margin-bottom: 3rem;
    }
    .drop-zone:hover, .drop-zone.dragging {
      border-color: var(--primary);
      background: var(--bg-input);
    }
    .hidden-input { display: none; }

    .icon-circle {
      width: 64px;
      height: 64px;
      background: var(--bg-input);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: var(--primary);
    }
    .icon-circle mat-icon { font-size: 32px; width: 32px; height: 32px; }

    .drop-content h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    .drop-content p { color: var(--text-secondary); font-size: 0.9rem; }

    /* Queue */
    .upload-queue { margin-bottom: 2rem; }
    .queue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .queue-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .upload-item {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .file-icon-wrapper {
      width: 40px;
      height: 40px;
      background: var(--bg-input);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    .file-details { flex: 1; }
    
    .file-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .file-size { color: var(--text-secondary); font-size: 0.8rem; }

    .status-msg {
      font-size: 0.8rem;
      margin-top: 0.25rem;
      color: var(--text-secondary);
    }

    .text-success { color: var(--success); }
    .text-error { color: var(--danger); }

    .back-link { text-align: center; }
  `]
})
export class UploadComponent {
  private readonly docService = inject(DocumentService);
  private readonly snackBar = inject(MatSnackBar);

  uploads = signal<UploadState[]>([]);
  isDragging = signal(false);

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging.set(true); }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragging.set(false); }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) this.handleFiles(Array.from(event.dataTransfer.files));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.handleFiles(Array.from(input.files));
  }

  handleFiles(files: File[]) {
    const newUploads: UploadState[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    this.uploads.update(curr => [...curr, ...newUploads]);
    this.processQueue();
  }

  processQueue() {
    this.uploads().forEach((upload, index) => {
      if (upload.status === 'pending') {
        this.uploadFile(upload, index);
      }
    });
  }

  uploadFile(upload: UploadState, index: number) {
    this.updateUploadStatus(index, 'uploading', 0);
    
    this.docService.uploadDocument(upload.file).subscribe({
      next: (event) => {
        if (event.progress) this.updateUploadStatus(index, 'uploading', event.progress);
        if (event.response) {
          this.updateUploadStatus(index, 'success', 100, undefined, event.response);
          this.snackBar.open(`${upload.file.name} uploaded!`, 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.updateUploadStatus(index, 'error', 0, err.message || 'Upload failed');
      }
    });
  }

  updateUploadStatus(index: number, status: any, progress: number, error?: string, result?: any) {
    this.uploads.update(uploads => {
      const newUploads = [...uploads];
      newUploads[index] = { ...newUploads[index], status, progress, errorMessage: error, result };
      return newUploads;
    });
  }

  clearCompleted() {
    this.uploads.update(uploads => uploads.filter(u => u.status !== 'success'));
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    if (file.type.includes('pdf')) return 'picture_as_pdf';
    if (file.type.includes('image')) return 'image';
    return 'insert_drive_file';
  }
}
