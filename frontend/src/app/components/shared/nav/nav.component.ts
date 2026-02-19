import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Top navigation bar shared across all pages.
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar class="nav-toolbar" color="primary">
      <div class="nav-brand">
        <mat-icon class="brand-icon">folder_special</mat-icon>
        <span class="brand-name">DocVault</span>
      </div>

      <span class="nav-spacer"></span>

      <nav class="nav-links">
        <a mat-button routerLink="/" routerLinkActive="active-link"
           [routerLinkActiveOptions]="{exact: true}">
          <mat-icon>home</mat-icon>
          <span>Home</span>
        </a>
        <a mat-button routerLink="/upload" routerLinkActive="active-link">
          <mat-icon>cloud_upload</mat-icon>
          <span>Upload</span>
        </a>
        <a mat-button routerLink="/documents" routerLinkActive="active-link">
          <mat-icon>folder_open</mat-icon>
          <span>Documents</span>
        </a>
      </nav>
    </mat-toolbar>
  `,
  styles: [`
    .nav-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: default;
    }
    .brand-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .brand-name {
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .nav-spacer { flex: 1; }
    .nav-links {
      display: flex;
      gap: 4px;
    }
    .nav-links a {
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: 8px;
      font-weight: 500;
      opacity: 0.85;
      transition: opacity 0.2s, background 0.2s;
    }
    .nav-links a:hover { opacity: 1; background: rgba(255,255,255,0.1); }
    .active-link { opacity: 1 !important; background: rgba(255,255,255,0.15) !important; }

    @media (max-width: 600px) {
      .nav-links a span { display: none; }
      .brand-name { font-size: 1.1rem; }
    }
  `]
})
export class NavComponent {}
