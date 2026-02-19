import {
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DocumentService } from '../../services/document.service';
import { UploadState } from '../../models/document.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="upload-container">

      <div class="page-header">
        <mat-icon class="page-icon">cloud_upload</mat-icon>
        <h1>Upload Documents</h1>
        <p>Drag & drop files or click to browse. Max 100 MB per file.</p>
      </div>

      <div
        class="drop-zone"
        [class.dragging]="isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          multiple
          class="hidden-input"
          (change)="onFileSelected($event)"
        />

        <div class="drop-zone-content">
          <mat-icon class="drop-icon">
            {{ isDragging() ? 'file_download' : 'cloud_upload' }}
          </mat-icon>

          <p class="drop-text">
            {{ isDragging() ? 'Release to upload!' : 'Drag files here' }}
          </p>

          <p class="drop-subtext">
            or <span class="browse-link">click to browse</span>
          </p>
        </div>
      </div>

      @if (uploads().length > 0) {
        <div class="upload-queue">

          <div class="queue-header">
            <h3>Upload Queue</h3>

            <button mat-button color="warn" (click)="clearCompleted()">
              Clear Completed
            </button>
          </div>

          @for (upload of uploads(); track upload.file.name) {
            <mat-card class="upload-item">

              <div class="upload-item-content">

                <mat-icon class="file-icon">
                  {{ getFileIcon(upload.file) }}
                </mat-icon>

                <div class="file-info">

                  <div class="file-name">
                    {{ upload.file.name }}
                  </div>

                  <div class="file-meta">
                    {{ formatSize(upload.file.size) }}

                    @if (upload.status === 'success') {
                      · <span class="success-text">Uploaded</span>
                    }

                    @if (upload.status === 'error') {
                      · <span class="error-text">{{ upload.errorMessage }}</span>
                    }
                  </div>

                  @if (upload.status === 'uploading') {
                    <mat-progress-bar
                      mode="determinate"
                      [value]="upload.progress"
                    />
                    <span class="progress-label">{{ upload.progress }}%</span>
                  }
                </div>

                <div class="status-icon">
                  @switch (upload.status) {
                    @case ('uploading') {
                      <mat-icon class="spin">sync</mat-icon>
                    }
                    @case ('success') {
                      <mat-icon class="success-icon">check_circle</mat-icon>
                    }
                    @case ('error') {
                      <mat-icon class="error-icon">error</mat-icon>
                    }
                    @default {
                      <mat-icon class="pending-icon">schedule</mat-icon>
                    }
                  }
                </div>
              </div>

              @if (upload.status === 'success' && upload.result?.downloadUrl) {
                <div class="download-link-row">
                  <a
                    mat-button
                    color="primary"
                    [href]="upload.result?.downloadUrl"
                    target="_blank"
                  >
                    <mat-icon>download</mat-icon>
                    Download
                  </a>
                </div>
              }

            </mat-card>
          }
        </div>
      }

      <div class="nav-link-row">
        <a mat-button routerLink="/documents">
          <mat-icon>folder_open</mat-icon>
          View Documents
        </a>
      </div>

    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .page-icon {
      font-size: 52px;
      width: 52px;
      height: 52px;
      color: var(--primary);
      margin-bottom: 10px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .page-header p {
      margin: 6px 0 0;
      color: var(--text-secondary);
    }

    /* Drop Zone */

    .drop-zone {
      border: 2px dashed #b0bec5;
      border-radius: 18px;
      padding: 48px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
      background: rgba(63, 81, 181, 0.03);
      margin-bottom: 28px;
    }

    .drop-zone:hover {
      border-color: var(--primary);
      background: rgba(63, 81, 181, 0.06);
    }

    .drop-zone.dragging {
      border-color: var(--primary);
      background: rgba(63, 81, 181, 0.12);
      transform: scale(1.01);
      box-shadow: 0 0 0 4px rgba(63, 81, 181, 0.2);
    }

    .hidden-input {
      display: none;
    }

    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .drop-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: var(--primary);
      opacity: 0.8;
    }

    .drop-text {
      margin: 4px 0 0;
      font-size: 1.15rem;
      font-weight: 600;
    }

    .drop-subtext {
      margin: 0;
      color: var(--text-secondary);
    }

    .browse-link {
      color: var(--primary);
      font-weight: 600;
      text-decoration: underline;
    }

    /* Queue */

    .upload-queue {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .queue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .queue-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .upload-item {
      border-radius: 12px;
    }

    .upload-item-content {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px;
    }

    .file-icon {
      color: var(--primary);
    }

    .file-info {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    mat-progress-bar {
      margin-top: 6px;
      border-radius: 4px;
    }

    .progress-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
    }

    .success-text { color: #43a047; font-weight: 600; }
    .error-text   { color: #e53935; font-weight: 600; }

    .success-icon { color: #43a047; }
    .error-icon   { color: #e53935; }
    .pending-icon { color: #9e9e9e; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }

    .download-link-row {
      padding: 0 14px 10px 54px;
    }

    .nav-link-row {
      display: flex;
      justify-content: center;
      margin-top: 18px;
    }

    @media (max-width: 600px) {
      .upload-item-content {
        flex-direction: column;
      }
    }
  `]
})
export class UploadComponent {
  private readonly docService = inject(DocumentService);
  private readonly snackBar   = inject(MatSnackBar);

  uploads    = signal<UploadState[]>([]);
  isDragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.queueFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.queueFiles(files);
    input.value = '';
  }

  private queueFiles(files: File[]): void {
    const newUploads: UploadState[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    this.uploads.update(existing => [...existing, ...newUploads]);
    this.uploadAll();
  }

  uploadAll(): void {
    const pending = this.uploads().filter(u => u.status === 'pending');
    pending.forEach(u => this.uploadFile(u));
  }

  private uploadFile(uploadState: UploadState): void {
    this.updateUpload(uploadState.file.name, {
      status: 'uploading',
      progress: 0
    });

    this.docService.uploadDocument(uploadState.file).subscribe({
      next: ({ progress, response }) => {
        this.updateUpload(uploadState.file.name, { progress });

        if (response) {
          this.updateUpload(uploadState.file.name, {
            status: 'success',
            progress: 100,
            result: response
          });

          this.snackBar.open(
            `✓ ${uploadState.file.name} uploaded`,
            'Dismiss',
            { duration: 3000 }
          );
        }
      },
      error: err => {
        const message = err?.error?.error ?? 'Upload failed';
        this.updateUpload(uploadState.file.name, {
          status: 'error',
          errorMessage: message
        });

        this.snackBar.open(`✗ ${message}`, 'Dismiss', {
          duration: 4000
        });
      }
    });
  }

  private updateUpload(fileName: string, patch: Partial<UploadState>): void {
    this.uploads.update(list =>
      list.map(u =>
        u.file.name === fileName ? { ...u, ...patch } : u
      )
    );
  }

  clearCompleted(): void {
    this.uploads.update(list =>
      list.filter(u => u.status === 'uploading' || u.status === 'pending')
    );
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'picture_as_pdf';
    if (file.type.includes('word')) return 'description';
    if (file.type.includes('excel')) return 'table_chart';
    return 'article';
  }
}
