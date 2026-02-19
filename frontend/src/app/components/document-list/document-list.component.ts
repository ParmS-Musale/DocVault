import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DocumentDto } from '../../models/document.model';

/**
 * Document listing page.
 * Fetches documents from the API and renders them
 * in a sortable, filterable Material table.
 */
@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="list-container">
      <!-- Header -->
      <div class="page-header">
        <mat-icon class="page-icon">folder_open</mat-icon>
        <h1>Document Library</h1>
        <p>{{ documents().length }} document{{ documents().length !== 1 ? 's' : '' }} stored</p>
      </div>

      <!-- Toolbar -->
      <mat-card class="toolbar-card">
        <div class="toolbar">
          <!-- Search -->
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search documents</mat-label>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()" placeholder="e.g. report.pdf">
            <mat-icon matPrefix>search</mat-icon>
            @if (searchTerm) {
              <button matSuffix mat-icon-button (click)="searchTerm = ''; applyFilter()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <!-- Refresh Button -->
          <button mat-stroked-button color="primary" (click)="loadDocuments()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>

          <!-- Upload Button -->
          <a mat-raised-button color="primary" routerLink="/upload">
            <mat-icon>cloud_upload</mat-icon>
            Upload
          </a>
        </div>
      </mat-card>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48" />
          <p>Loading documents...</p>
        </div>
      }

      <!-- Error State -->
      @if (error() && !loading()) {
        <mat-card class="error-card">
          <mat-icon class="error-icon-lg">error_outline</mat-icon>
          <h3>Failed to load documents</h3>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadDocuments()">
            Try Again
          </button>
        </mat-card>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && filteredDocuments().length === 0) {
        <div class="empty-state">
          @if (searchTerm) {
            <mat-icon>search_off</mat-icon>
            <h3>No results found</h3>
            <p>No documents match "<strong>{{ searchTerm }}</strong>". Try a different search.</p>
          } @else {
            <mat-icon>cloud_queue</mat-icon>
            <h3>No documents yet</h3>
            <p>Upload your first document to get started.</p>
            <a mat-raised-button color="primary" routerLink="/upload">
              <mat-icon>cloud_upload</mat-icon>
              Upload Document
            </a>
          }
        </div>
      }

      <!-- Document Table -->
      @if (!loading() && !error() && filteredDocuments().length > 0) {
        <mat-card class="table-card">
          <div class="table-wrapper">
            <table mat-table [dataSource]="filteredDocuments()" matSort (matSortChange)="sortData($event)" class="doc-table">

              <!-- File Name Column -->
              <ng-container matColumnDef="fileName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>File Name</th>
                <td mat-cell *matCellDef="let doc">
                  <div class="file-name-cell">
                    <mat-icon class="row-icon" [class]="'type-' + getFileType(doc)">
                      {{ getFileIcon(doc) }}
                    </mat-icon>
                    <span class="file-name-text" [matTooltip]="doc.fileName">{{ doc.fileName }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- File Size Column -->
              <ng-container matColumnDef="fileSize">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Size</th>
                <td mat-cell *matCellDef="let doc">
                  <mat-chip class="size-chip">{{ formatSize(doc.fileSize) }}</mat-chip>
                </td>
              </ng-container>

              <!-- Content Type Column -->
              <ng-container matColumnDef="contentType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let doc">
                  <span class="content-type">{{ getShortType(doc.contentType) }}</span>
                </td>
              </ng-container>

              <!-- Upload Date Column -->
              <ng-container matColumnDef="uploadDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Upload Date</th>
                <td mat-cell *matCellDef="let doc">
                  <div class="date-cell">
                    <span class="date-primary">{{ doc.uploadDate | date:'MMM d, y' }}</span>
                    <span class="date-secondary">{{ doc.uploadDate | date:'h:mm a' }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let doc">
                  <div class="actions-cell">
                    <a
                      mat-icon-button
                      color="primary"
                      [href]="doc.downloadUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      matTooltip="Download file"
                    >
                      <mat-icon>download</mat-icon>
                    </a>
                    <button
                      mat-icon-button
                      (click)="copyLink(doc.downloadUrl)"
                      matTooltip="Copy download link"
                    >
                      <mat-icon>content_copy</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="doc-row"></tr>
            </table>
          </div>

          <!-- Table Footer -->
          <div class="table-footer">
            <span class="result-count">
              Showing {{ filteredDocuments().length }} of {{ documents().length }} documents
            </span>
          </div>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .list-container {
      max-width: 1100px;
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

    /* ── Toolbar ─────────────────────────────────────────── */
    .toolbar-card { border-radius: 16px !important; margin-bottom: 20px; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 240px; }
    .toolbar button, .toolbar a { white-space: nowrap; }

    /* ── States ──────────────────────────────────────────── */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px;
      color: var(--text-secondary);
    }

    .error-card {
      text-align: center;
      padding: 48px;
      border-radius: 16px !important;
    }
    .error-icon-lg {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #e53935;
      margin-bottom: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 80px 24px;
      color: var(--text-secondary);
    }
    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
      opacity: 0.3;
    }
    .empty-state h3 { font-size: 1.4rem; margin: 0 0 8px; color: var(--text-primary); }
    .empty-state p  { margin: 0 0 24px; }

    /* ── Table ───────────────────────────────────────────── */
    .table-card { border-radius: 16px !important; overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    .doc-table { width: 100%; }

    .doc-row { transition: background 0.15s; }
    .doc-row:hover { background: rgba(63,81,181,0.04); }

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 160px;
    }
    .row-icon { font-size: 22px; width: 22px; height: 22px; }
    .file-name-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 260px;
      font-weight: 500;
    }
    .type-pdf   { color: #e53935; }
    .type-image { color: #fb8c00; }
    .type-doc   { color: #1565c0; }
    .type-sheet { color: #2e7d32; }
    .type-text  { color: #546e7a; }

    .size-chip {
      font-size: 0.75rem !important;
      height: 22px !important;
      background: rgba(63,81,181,0.1) !important;
      color: var(--primary) !important;
    }

    .content-type {
      font-size: 0.8rem;
      color: var(--text-secondary);
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .date-cell { display: flex; flex-direction: column; }
    .date-primary   { font-weight: 500; font-size: 0.9rem; }
    .date-secondary { font-size: 0.75rem; color: var(--text-secondary); }

    .actions-cell { display: flex; gap: 4px; }

    .table-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.08);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class DocumentListComponent implements OnInit {
  private readonly docService = inject(DocumentService);

  documents         = signal<DocumentDto[]>([]);
  filteredDocuments = signal<DocumentDto[]>([]);
  loading           = signal(false);
  error             = signal<string | null>(null);
  searchTerm        = '';

  displayedColumns = ['fileName', 'fileSize', 'contentType', 'uploadDate', 'actions'];

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.docService.getDocuments().subscribe({
      next: docs => {
        this.documents.set(docs);
        this.filteredDocuments.set(docs);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.error ?? 'Unable to connect to the API.');
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    const raw = this.searchTerm.trim();

    if (!raw) {
      this.filteredDocuments.set(this.documents());
      return;
    }

    // Delegate filtering to the backend search endpoint for better scalability.
    this.loading.set(true);
    this.docService.searchDocuments(raw).subscribe({
      next: docs => {
        this.filteredDocuments.set(docs);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.error ?? 'Unable to search documents.');
        this.loading.set(false);
      }
    });
  }

  sortData(sort: Sort): void {
    const data = [...this.filteredDocuments()];
    if (!sort.active || sort.direction === '') {
      this.filteredDocuments.set(data);
      return;
    }

    this.filteredDocuments.set(data.sort((a, b) => {
      const asc = sort.direction === 'asc';
      switch (sort.active) {
        case 'fileName':   return compare(a.fileName, b.fileName, asc);
        case 'fileSize':   return compare(a.fileSize, b.fileSize, asc);
        case 'uploadDate': return compare(a.uploadDate, b.uploadDate, asc);
        default: return 0;
      }
    }));
  }

  async copyLink(url: string): Promise<void> {
    await navigator.clipboard.writeText(url);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  getFileType(doc: DocumentDto): string {
    if (doc.contentType.startsWith('image/'))              return 'image';
    if (doc.contentType === 'application/pdf')             return 'pdf';
    if (doc.contentType.includes('spreadsheet') || doc.contentType.includes('excel')) return 'sheet';
    if (doc.contentType.includes('word') || doc.contentType.includes('document'))     return 'doc';
    return 'text';
  }

  getFileIcon(doc: DocumentDto): string {
    const icons: Record<string, string> = {
      image: 'image',
      pdf:   'picture_as_pdf',
      sheet: 'table_chart',
      doc:   'description',
      text:  'article'
    };
    return icons[this.getFileType(doc)] ?? 'insert_drive_file';
  }

  getShortType(contentType: string): string {
    const map: Record<string, string> = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png':  'PNG',
      'image/gif':  'GIF',
      'text/plain': 'TXT',
      'text/csv':   'CSV',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX'
    };
    return map[contentType] ?? contentType.split('/')[1]?.toUpperCase() ?? '?';
  }
}

function compare(a: string | number, b: string | number, asc: boolean): number {
  return (a < b ? -1 : a > b ? 1 : 0) * (asc ? 1 : -1);
}
