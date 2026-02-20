import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

import { DocumentService } from '../../services/document.service';
import { DocumentDto } from '../../models/document.model';
import { DocumentCardComponent } from '../document-card/document-card.component';

interface DocumentGroup {
  category: string;
  icon: string;
  files: DocumentDto[];
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    DocumentCardComponent
  ],
  template: `
    <div class="dashboard-container">
      
      <!-- Welcome / Stats Header -->
      <div class="dashboard-header">
        <div class="header-text">
          <h1>My Documents</h1>
          <p class="subtitle">{{ totalFiles() }} files stored in DocVault</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/upload" class="upload-btn">
          <mat-icon>cloud_upload</mat-icon>
          Upload New
        </a>
      </div>

      <!-- Search & Filters -->
      <div class="toolbar">
        <div class="search-wrapper">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            placeholder="Search by name..." 
            [(ngModel)]="searchTerm" 
            (input)="applyFilter()"
            class="search-input"
          >
          @if (searchTerm) {
            <button mat-icon-button (click)="clearSearch()" class="clear-btn">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <button mat-stroked-button (click)="loadDocuments()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="state-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Syncing your documents...</p>
        </div>
      }

      <!-- Error State -->
      @if (error() && !loading()) {
        <div class="state-container error">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Unable to load documents</h3>
          <p>{{ error() }}</p>
          <button mat-flat-button color="primary" (click)="loadDocuments()">Retry</button>
        </div>
      }

      <!-- Empty Results State -->
      @if (!loading() && !error() && groups().length === 0) {
        <div class="state-container empty">
          <img src="https://cdn-icons-png.flaticon.com/512/7486/7486776.png" alt="No files" width="120" style="opacity: 0.5; margin-bottom: 1rem;">
          @if (searchTerm) {
            <h3>No results found</h3>
            <p>We couldn't find any files matching "{{ searchTerm }}".</p>
            <button mat-stroked-button (click)="clearSearch()">Clear Search</button>
          } @else {
            <h3>Ready to store your files</h3>
            <p>Upload documents, images, and sheets to get started.</p>
            <a mat-flat-button color="primary" routerLink="/upload">Upload Now</a>
          }
        </div>
      }

      <!-- Document Groups -->
      @if (!loading() && !error()) {
        <div class="groups-container">
          @for (group of groups(); track group.category) {
            <section class="doc-group">
              <div class="group-header" (click)="toggleGroup(group.category)">
                <div class="header-left">
                  <mat-icon class="group-icon">{{ group.icon }}</mat-icon>
                  <h2>{{ group.category }}</h2>
                  <span class="count-badge">{{ group.files.length }}</span>
                </div>
                <!-- <mat-icon class="expand-icon">expand_more</mat-icon> -->
              </div>

              <div class="doc-grid">
                @for (doc of group.files; track doc.id) {
                  <app-document-card 
                    [document]="doc" 
                    (onDelete)="deleteDocument(doc)"
                    (onPreview)="previewDocument(doc)"
                  />
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1100px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }

    .dashboard-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 3rem;
      text-align: center;
    }
    
    .dashboard-header .header-text {
      margin-bottom: 1.5rem;
    }

    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 700; }
    .subtitle { color: var(--text-secondary); font-size: 1.1rem; }

    .upload-btn {
      padding: 0 2rem !important;
      height: 48px;
    }

    /* Toolbar & Search */
    .toolbar {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .search-wrapper {
      width: 480px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-secondary);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      height: 48px;
      padding: 0 1rem 0 3rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      font-size: 1rem;
      background: var(--bg-surface);
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 0.5rem;
      color: var(--text-secondary);
    }

    /* States */
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 0;
      text-align: center;
      color: var(--text-secondary);
    }
    .state-container.error { color: var(--danger); }
    .error-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; }

    /* Groups */
    .groups-container {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .doc-group {
      animation: fadeIn 0.4s ease;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      cursor: pointer;
      user-select: none;
    }

    .group-icon { color: var(--primary); }
    .group-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
    
    .count-badge {
      background: var(--bg-input);
      color: var(--text-secondary);
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .doc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DocumentListComponent implements OnInit {
  private readonly docService = inject(DocumentService);
  private readonly route = inject(ActivatedRoute);

  documents         = signal<DocumentDto[]>([]);
  filteredDocuments = signal<DocumentDto[]>([]);
  loading           = signal(false);
  error             = signal<string | null>(null);
  searchTerm        = '';

  // Smart Grouping Logic
  groups = computed(() => {
    const docs = this.filteredDocuments();
    const groupsMap = new Map<string, DocumentDto[]>();

    // Initial groups order
    groupsMap.set('PDFs', []);
    groupsMap.set('Images', []);
    groupsMap.set('Spreadsheets', []);
    groupsMap.set('Documents', []);
    groupsMap.set('Others', []);

    docs.forEach(doc => {
      const type = doc.contentType;
      if (type === 'application/pdf') {
        groupsMap.get('PDFs')?.push(doc);
      } else if (type.startsWith('image/')) {
        groupsMap.get('Images')?.push(doc);
      } else if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
        groupsMap.get('Spreadsheets')?.push(doc);
      } else if (type.includes('word') || type.includes('document') || type.includes('text/plain')) {
        groupsMap.get('Documents')?.push(doc);
      } else {
        groupsMap.get('Others')?.push(doc);
      }
    });

    const result: DocumentGroup[] = [];
    const icons: Record<string, string> = {
      'PDFs': 'picture_as_pdf',
      'Images': 'image',
      'Spreadsheets': 'table_chart',
      'Documents': 'description',
      'Others': 'folder'
    };

    for (const [category, files] of groupsMap.entries()) {
      if (files.length > 0) {
        result.push({
          category,
          icon: icons[category],
          files
        });
      }
    }

    return result;
  });

  totalFiles = computed(() => this.documents().length);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        // filter by type logic if needed in future
      }
    });
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
        this.applyFilter(); // re-apply search if exists
      },
      error: err => {
        console.error(err);
        this.error.set('Could not load your documents. Please try again.');
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredDocuments.set(this.documents());
      return;
    }

    const filtered = this.documents().filter(doc => 
      doc.fileName.toLowerCase().includes(term)
    );
    this.filteredDocuments.set(filtered);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  toggleGroup(category: string) {
    // Toggle logic can be added here (collapsed state)
  }

  deleteDocument(doc: DocumentDto) {
    if(confirm(`Are you sure you want to delete ${doc.fileName}?`)) {
      this.docService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.documents.update(docs => docs.filter(d => d.id !== doc.id));
          this.applyFilter();
        },
        error: (err) => {
          console.error('Error deleting document', err);
          // Optional: Show a toast/snackbar here
          alert('Failed to delete document');
        }
      });
    }
  }

  previewDocument(doc: DocumentDto) {
    window.open(doc.downloadUrl, '_blank');
  }
}
