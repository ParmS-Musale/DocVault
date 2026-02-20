import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { DocumentDto } from '../../models/document.model';

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <div class="doc-card">
      <div class="thumbnail-area" [class.pdf]="isPdf" [class.image]="isImage" [class.sheet]="isSheet" [class.doc]="isDoc">
        <mat-icon class="file-icon">{{ getIcon() }}</mat-icon>
      </div>

      <div class="info-area">
        <h3 class="file-name" [title]="document.fileName">{{ document.fileName }}</h3>
        <p class="file-meta">{{ formatBytes(document.fileSize) }} • {{ document.uploadDate | date:'mediumDate' }}</p>
      </div>

      <div class="actions">
        <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <a mat-menu-item [href]="document.downloadUrl" target="_blank">
            <mat-icon>download</mat-icon>
            <span>Download</span>
          </a>
          <button mat-menu-item (click)="onPreview.emit(document)">
            <mat-icon>visibility</mat-icon>
            <span>Preview</span>
          </button>
          <button mat-menu-item class="delete-btn" (click)="onDelete.emit(document)">
            <mat-icon color="warn">delete</mat-icon>
            <span class="text-error">Delete</span>
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styles: [`
    .doc-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1rem;
      position: relative;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
    }

    .doc-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-light);
    }

    .thumbnail-area {
      height: 120px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    .thumbnail-area.pdf { color: #ef4444; background: #fef2f2; }
    .thumbnail-area.image { color: #3b82f6; background: #eff6ff; }
    .thumbnail-area.sheet { color: #10b981; background: #ecfdf5; }
    .thumbnail-area.doc { color: #f59e0b; background: #fffbeb; }

    .file-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .info-area {
      flex: 1;
    }

    .file-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-main);
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .doc-card:hover .actions {
      opacity: 1;
    }

    .text-error { color: var(--danger); }
  `]
})
export class DocumentCardComponent {
  @Input({ required: true }) document!: DocumentDto;
  @Output() onDelete = new EventEmitter<DocumentDto>();
  @Output() onPreview = new EventEmitter<DocumentDto>();

  get isPdf() { return this.document.contentType === 'application/pdf'; }
  get isImage() { return this.document.contentType.startsWith('image/'); }
  get isSheet() { return this.document.contentType.includes('spreadsheet') || this.document.contentType.includes('csv') || this.document.contentType.includes('excel'); }
  get isDoc() { return !this.isPdf && !this.isImage && !this.isSheet; }

  getIcon(): string {
    if (this.isPdf) return 'picture_as_pdf';
    if (this.isImage) return 'image';
    if (this.isSheet) return 'table_chart';
    return 'description';
  }

  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
