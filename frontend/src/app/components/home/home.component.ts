import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DocumentService } from '../../services/document.service';
import { HealthDto } from '../../models/document.model';

/**
 * Home / dashboard page.
 * Shows feature cards, quick links, and live API health status.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="home-container">

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-icon-wrap">
            <mat-icon class="hero-icon">folder_special</mat-icon>
          </div>
          <h1 class="hero-title">Welcome to <span class="brand">DocVault</span></h1>
          <p class="hero-subtitle">
            Secure, scalable document storage powered by Azure Blob Storage &amp; Cosmos DB.
            Upload, manage, and download your files from anywhere.
          </p>
          <div class="hero-actions">
            <a mat-raised-button color="primary" routerLink="/upload" class="hero-btn">
              <mat-icon>cloud_upload</mat-icon>
              Upload Document
            </a>
            <a mat-stroked-button color="primary" routerLink="/documents" class="hero-btn">
              <mat-icon>folder_open</mat-icon>
              View Documents
            </a>
          </div>
        </div>
      </section>

      <!-- API Health Badge -->
      <div class="health-banner" *ngIf="health() as h">
        <mat-icon [class.healthy]="h.status === 'Healthy'" class="health-dot">
          {{ h.status === 'Healthy' ? 'check_circle' : 'error' }}
        </mat-icon>
        <span>API <strong>{{ h.status }}</strong> · v{{ h.version }}</span>
      </div>

      <!-- Feature Cards -->
      <section class="features">
        <mat-card class="feature-card">
          <mat-card-header>
            <div mat-card-avatar class="feat-avatar feat-upload">
              <mat-icon>cloud_upload</mat-icon>
            </div>
            <mat-card-title>Drag & Drop Upload</mat-card-title>
            <mat-card-subtitle>Up to 100 MB per file</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Drop files onto the upload zone or use the file picker.
               Real-time upload progress keeps you informed.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button color="primary" routerLink="/upload">Upload Now</a>
          </mat-card-actions>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <div mat-card-avatar class="feat-avatar feat-list">
              <mat-icon>table_rows</mat-icon>
            </div>
            <mat-card-title>Document Library</mat-card-title>
            <mat-card-subtitle>Instant SAS download links</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Browse all your uploaded documents with file names, sizes, upload
               dates, and secure time-limited download links.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button color="primary" routerLink="/documents">Browse Files</a>
          </mat-card-actions>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <div mat-card-avatar class="feat-avatar feat-cloud">
              <mat-icon>shield</mat-icon>
            </div>
            <mat-card-title>Azure-Powered</mat-card-title>
            <mat-card-subtitle>Enterprise-grade security</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Files stored in Azure Blob Storage with lifecycle management.
               Metadata in Cosmos DB for fast, global queries.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button disabled>Learn More</a>
          </mat-card-actions>
        </mat-card>
      </section>

      <!-- Tech Stack Chips -->
      <section class="stack-section">
        <h3 class="stack-title">Built With</h3>
        <div class="stack-chips">
          @for (tech of techStack; track tech.label) {
            <mat-chip class="stack-chip" [style.background]="tech.color">
              {{ tech.label }}
            </mat-chip>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    /* ── Hero ─────────────────────────────────────────── */
    .hero {
      text-align: center;
      padding: 60px 24px 48px;
    }
    .hero-icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }
    .hero-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--primary);
      filter: drop-shadow(0 4px 12px rgba(63,81,181,0.3));
    }
    .hero-title {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 800;
      margin: 0 0 16px;
      color: var(--text-primary);
    }
    .brand { color: var(--primary); }
    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 32px;
      line-height: 1.7;
    }
    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .hero-btn { padding: 10px 24px; border-radius: 8px; font-size: 1rem; }
    .hero-btn mat-icon { margin-right: 6px; }

    /* ── Health Banner ─────────────────────────────────── */
    .health-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      margin-bottom: 32px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .health-dot { font-size: 18px; color: #9e9e9e; }
    .health-dot.healthy { color: #43a047; }

    /* ── Feature Cards ─────────────────────────────────── */
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }
    .feature-card {
      border-radius: 16px !important;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
    }
    .feat-avatar {
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
    }
    .feat-avatar mat-icon { color: #fff; font-size: 26px; }
    .feat-upload { background: linear-gradient(135deg, #667eea, #764ba2); }
    .feat-list   { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .feat-cloud  { background: linear-gradient(135deg, #f093fb, #f5576c); }

    /* ── Tech Stack ────────────────────────────────────── */
    .stack-section { text-align: center; }
    .stack-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .stack-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }
    .stack-chip {
      color: #fff !important;
      font-weight: 600;
      border-radius: 20px !important;
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly docService = inject(DocumentService);

  health = signal<HealthDto | null>(null);

  readonly techStack = [
    { label: 'Angular 17+',         color: '#dd1b16' },
    { label: 'Angular Material',    color: '#7b1fa2' },
    { label: '.NET 8 Web API',      color: '#512bd4' },
    { label: 'Azure Blob Storage',  color: '#0072c6' },
    { label: 'Azure Cosmos DB',     color: '#00bcf2' },
    { label: 'GitHub Actions',      color: '#24292e' }
  ];

  ngOnInit(): void {
    this.docService.checkHealth().subscribe({
      next: h => this.health.set(h),
      error: () => {} // silently fail – health is informational
    });
  }
}
