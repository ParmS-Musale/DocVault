import {
  Component,
  inject,
  signal,
  HostListener,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocumentService } from '../../services/document.service';
import { UploadState } from '../../models/document.model';

/**
 * Upload page.
 * Supports drag & drop and file picker.
 * Shows real-time upload progress per file.
 */
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
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="upload-container">
      <div class="page-header">
        <mat-icon class="page-icon">cloud_upload</mat-icon>
        <h1>Upload Documents</h1>
        <p>Drag & drop files or click to browse. Max 100 MB per file.</p>
      </div>

      <!-- Drop Zone -->
      <div
        class="drop-zone"
        [class.dragging]="isDragging()"
        [class.has-files]="uploads().length > 0"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
          class="hidden-input"
          (change)="onFileSelected($event)"
        />

        @if (!isDragging()) {
          <div class="drop-zone-content">
            <mat-icon class="drop-icon">cloud_upload</mat-icon>
            <p class="drop-text">Drag files here</p>
            <p class="drop-subtext">or <span class="browse-link">click to browse</span></p>
            <div class="allowed-types">
              <span>PDF · DOCX · XLSX · JPG · PNG · TXT · CSV</span>
            </div>
          </div>
        } @else {
          <div class="drop-zone-content dragging-content">
            <mat-icon class="drop-icon bounce">file_download</mat-icon>
            <p class="drop-text">Release to upload!</p>
          </div>
        }
      </div>

      <!-- Upload Queue -->
      @if (uploads().length > 0) {
        <div class="upload-queue">
          <div class="queue-header">
            <h3>Upload Queue</h3>
            <button mat-button color="warn" (click)="clearCompleted()">
              Clear Completed
            </button>
          </div>

          @for (upload of uploads(); track upload.file.name) {
            <mat-card class="upload-item" [class]="'status-' + upload.status">
              <div class="upload-item-content">
                <!-- File Type Icon -->
                <mat-icon class="file-icon" [class]="'type-' + getFileType(upload.file)">
                  {{ getFileIcon(upload.file) }}
                </mat-icon>

                <!-- File Info -->
                <div class="file-info">
                  <div class="file-name">{{ upload.file.name }}</div>
                  <div class="file-meta">
                    {{ formatSize(upload.file.size) }}
                    @if (upload.status === 'success') {
                      · <span class="success-text">Uploaded</span>
                    }
                    @if (upload.status === 'error') {
                      · <span class="error-text">{{ upload.errorMessage }}</span>
                    }
                  </div>

                  @if (upload.status === 'uploading' || upload.status === 'pending') {
                    <mat-progress-bar
                      mode="determinate"
                      [value]="upload.progress"
                      class="upload-progress"
                    />
                    <span class="progress-label">{{ upload.progress }}%</span>
                  }
                </div>

                <!-- Status Icon -->
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

              <!-- Download link after success -->
              @if (upload.status === 'success' && upload.result?.downloadUrl) {
                <div class="download-link-row">
                  <a
                    mat-button
                    color="primary"
                    [href]="upload.result!.downloadUrl"
                    target="_blank"
                    rel="noopener"
                  >
                    <mat-icon>download</mat-icon>
                    Download Now
                  </a>
                </div>
              }
            </mat-card>
          }

          <!-- Upload All Button -->
          @if (hasPendingUploads()) {
            <div class="upload-all-btn">
              <button
                mat-raised-button
                color="primary"
                (click)="uploadAll()"
                [disabled]="isUploading()"
              >
                <mat-icon>cloud_upload</mat-icon>
                Upload All ({{ pendingCount() }} files)
              </button>
            </div>
          }
        </div>
      }

      <!-- Navigation Link -->
      <div class="nav-link-row">
        <a mat-button routerLink="/documents">
          <mat-icon>folder_open</mat-icon>
          View All Documents
        </a>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .page-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--primary);
      margin-bottom: 12px;
    }
    .page-header h1 { margin: 0 0 8px; font-size: 2rem; font-weight: 700; }
    .page-header p  { color: var(--text-secondary); margin: 0; }

    /* ── Drop Zone ──────────────────────────────────────── */
    .drop-zone {
      border: 2px dashed #90a4ae;
      border-radius: 20px;
      padding: 56px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
      background: rgba(63,81,181,0.02);
      margin-bottom: 32px;
    }
    .drop-zone:hover, .drop-zone.has-files {
      border-color: var(--primary);
      background: rgba(63,81,181,0.05);
    }
    .drop-zone.dragging {
      border-color: var(--primary);
      background: rgba(63,81,181,0.1);
      transform: scale(1.01);
      box-shadow: 0 0 0 4px rgba(63,81,181,0.2);
    }
    .hidden-input { display: none; }

    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .drop-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--primary);
      opacity: 0.7;
    }
    .drop-text {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .drop-subtext {
      color: var(--text-secondary);
      margin: 0;
    }
    .browse-link {
      color: var(--primary);
      font-weight: 600;
      text-decoration: underline;
    }
    .allowed-types {
      font-size: 0.8rem;
      color: #9e9e9e;
      margin-top: 8px;
    }
    .dragging-content .drop-icon { opacity: 1; }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-10px); }
    }
    .bounce { animation: bounce 0.7s infinite; }

    /* ── Upload Queue ───────────────────────────────────── */
    .upload-queue { display: flex; flex-direction: column; gap: 12px; }
    .queue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .queue-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }

    .upload-item {
      border-radius: 12px !important;
      transition: box-shadow 0.2s;
    }
    .upload-item.status-success { border-left: 4px solid #43a047; }
    .upload-item.status-error   { border-left: 4px solid #e53935; }
    .upload-item.status-uploading { border-left: 4px solid var(--primary); }

    .upload-item-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
    }
    .file-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .type-pdf   { color: #e53935; }
    .type-image { color: #fb8c00; }
    .type-doc   { color: #1565c0; }
    .type-sheet { color: #2e7d32; }
    .type-text  { color: #546e7a; }

    .file-info { flex: 1; min-width: 0; }
    .file-name {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-meta { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }

    .upload-progress { margin-top: 8px; border-radius: 4px; }
    .progress-label  { font-size: 0.75rem; color: var(--primary); font-weight: 600; }

    .success-text { color: #43a047; font-weight: 600; }
    .error-text   { color: #e53935; font-weight: 600; }

    .status-icon mat-icon { font-size: 24px; }
    .success-icon { color: #43a047; }
    .error-icon   { color: #e53935; }
    .pending-icon { color: #9e9e9e; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; color: var(--primary); }

    .download-link-row {
      padding: 0 16px 12px 68px;
    }

    .upload-all-btn {
      display: flex;
      justify-content: center;
      margin-top: 8px;
    }
    .upload-all-btn button { padding: 10px 32px; border-radius: 8px; }
    .upload-all-btn mat-icon { margin-right: 6px; }

    .nav-link-row {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  `]
})
export class UploadComponent {
  private readonly docService = inject(DocumentService);
  private readonly snackBar   = inject(MatSnackBar);

  uploads    = signal<UploadState[]>([]);
  isDragging = signal(false);

  isUploading   = () => this.uploads().some(u => u.status === 'uploading');
  hasPendingUploads = () => this.uploads().some(u => u.status === 'pending');
  pendingCount  = () => this.uploads().filter(u => u.status === 'pending').length;

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = Array.from(event.dataTransfer?.files ?? []);
    this.queueFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files  = Array.from(input.files ?? []);
    this.queueFiles(files);
    input.value = '';   // reset so the same file can be re-selected
  }

  // ── Queue Management ───────────────────────────────────────────────────────

  private queueFiles(files: File[]): void {
    const newEntries: UploadState[] = files.map(f => ({
      file: f,
      progress: 0,
      status: 'pending'
    }));

    this.uploads.update(existing => [...existing, ...newEntries]);
    // Auto-start uploads immediately
    this.uploadAll();
  }

  uploadAll(): void {
    const pending = this.uploads().filter(u => u.status === 'pending');
    pending.forEach(u => this.uploadFile(u));
  }

  private uploadFile(uploadState: UploadState): void {
    // Mark as uploading
    this.updateUpload(uploadState.file.name, { status: 'uploading', progress: 0 });

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
            `✓ ${uploadState.file.name} uploaded successfully!`,
            'Dismiss',
            { duration: 4000, panelClass: 'snack-success' }
          );
        }
      },
      error: err => {
        const message = err?.error?.error ?? 'Upload failed. Please try again.';
        this.updateUpload(uploadState.file.name, {
          status: 'error',
          errorMessage: message
        });
        this.snackBar.open(`✗ ${message}`, 'Dismiss', {
          duration: 6000,
          panelClass: 'snack-error'
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
      list.filter(u => u.status !== 'success' && u.status !== 'error')
    );
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  getFileType(file: File): string {
    if (file.type.startsWith('image/'))           return 'image';
    if (file.type === 'application/pdf')           return 'pdf';
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'sheet';
    if (file.type.includes('word') || file.type.includes('document'))     return 'doc';
    return 'text';
  }

  getFileIcon(file: File): string {
    const type = this.getFileType(file);
    const icons: Record<string, string> = {
      image: 'image',
      pdf:   'picture_as_pdf',
      sheet: 'table_chart',
      doc:   'description',
      text:  'article'
    };
    return icons[type] ?? 'insert_drive_file';
  }
}
