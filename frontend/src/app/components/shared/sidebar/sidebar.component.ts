import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatListModule],
  template: `
    <div class="sidebar-container">
      <div class="brand">
        <mat-icon class="brand-icon">cloud_circle</mat-icon>
        <span class="brand-name">DocVault</span>
      </div>

      <nav class="nav-links">
        <a routerLink="/documents" routerLinkActive="active" class="nav-item">
          <mat-icon>dashboard</mat-icon>
          <span>All Documents</span>
        </a>
        <a routerLink="/documents" [queryParams]="{ type: 'pdf' }" routerLinkActive="active" class="nav-item">
          <mat-icon>picture_as_pdf</mat-icon>
          <span>PDFs</span>
        </a>
        <a routerLink="/documents" [queryParams]="{ type: 'image' }" routerLinkActive="active" class="nav-item">
          <mat-icon>image</mat-icon>
          <span>Images</span>
        </a>
        <a routerLink="/documents" [queryParams]="{ type: 'sheet' }" routerLinkActive="active" class="nav-item">
          <mat-icon>table_chart</mat-icon>
          <span>Spreadsheets</span>
        </a>
      </nav>

      <div class="settings-area">
        <a routerLink="/settings" class="nav-item">
          <mat-icon>settings</mat-icon>
          <span>Settings</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      padding: 1.5rem 1rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
      padding-left: 0.75rem;
      color: var(--primary);
    }

    .brand-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.025em;
    }

    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex-grow: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .nav-item:hover {
      background-color: var(--bg-app);
      color: var(--primary);
    }

    .nav-item.active {
      background-color: #eef2ff; /* Light Indigo */
      color: var(--primary);
    }

    .nav-item mat-icon {
      margin-right: 0;
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
  `]
})
export class SidebarComponent {}
