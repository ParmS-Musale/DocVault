import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


import { MsalService } from "@azure/msal-angular";
import { AccountInfo } from "@azure/msal-browser";

import { DocumentService } from "../../services/document.service";
import { HealthDto } from "../../models/document.model";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,

  ],
  template: `
    <div class="home-container">

      
      <section class="hero">
        <div class="hero-icon-wrap">
          <mat-icon class="hero-icon">folder_special</mat-icon>
        </div>

        <h1 class="hero-title">
          Welcome to <span class="brand">DocVault</span>
        </h1>

        <p class="hero-subtitle">
          Secure, scalable document storage powered by Azure Blob Storage & Cosmos DB.
          Upload, manage, and download your files from anywhere.
        </p>

        <div class="hero-actions">
          <a mat-raised-button color="primary" routerLink="/upload">
            <mat-icon>cloud_upload</mat-icon>
            Upload Document
          </a>

          <a mat-stroked-button color="primary" routerLink="/documents">
            <mat-icon>folder_open</mat-icon>
            View Documents
          </a>
        </div>
      </section>

      

      <section class="features">

        <mat-card class="feature-card">
          <mat-icon>cloud_upload</mat-icon>
          <h3>Drag & Drop Upload</h3>
          <p>Upload up to 100 MB per file</p>
          <a routerLink="/upload">Upload Now</a>
        </mat-card>

        <mat-card class="feature-card">
          <mat-icon>menu_book</mat-icon>
          <h3>Document Library</h3>
          <p>Instant SAS download links</p>
          <a routerLink="/documents">Browse Files</a>
        </mat-card>

        <mat-card class="feature-card">
          <mat-icon>shield</mat-icon>
          <h3>Azure-Powered</h3>
          <p>Enterprise-grade security</p>
          <span class="disabled-link">Learn More</span>
        </mat-card>

      </section>



    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 24px 60px;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-radius: var(--radius-lg);
      background: var(--bg-input);
      margin-bottom: 22px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--text-main);
    }

    .hero {
      text-align: center;
      margin-top: 2rem;
    }

    .hero-icon-wrap {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: var(--radius-xl);
      background: rgba(79, 70, 229, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--primary);
    }

    .hero-title {
      font-size: 2.5rem;
      margin: 1rem 0;
      font-weight: 700;
      color: var(--text-main);
    }

    .brand {
      color: var(--primary);
    }

    .hero-subtitle {
      max-width: 640px;
      margin: 0 auto 2rem;
      color: var(--text-secondary);
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .features {
      margin-top: 4rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      padding: 1.5rem;
      border-radius: var(--radius-lg) !important;
      text-align: left;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      transition: transform 0.2s;
    }
    
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .feature-card mat-icon {
      color: var(--primary);
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .feature-card p {
      margin: 0 0 1rem;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .feature-card a {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--primary);
      text-decoration: none;
    }
    .feature-card a:hover { text-decoration: underline; }

    .disabled-link {
      color: var(--text-disabled);
      font-size: 0.9rem;
    }


  `]
})
export class HomeComponent implements OnInit {
  private readonly docService = inject(DocumentService);
  private readonly msalService = inject(MsalService);

  health = signal<HealthDto | null>(null);
  user = signal<AccountInfo | null>(null);



  ngOnInit(): void {
    this.docService.checkHealth().subscribe({
      next: (h) => this.health.set(h),
      error: () => this.health.set(null),
    });

    const accounts = this.msalService.instance.getAllAccounts();

    if (accounts.length > 0) {
      this.msalService.instance.setActiveAccount(accounts[0]);
      this.user.set(accounts[0]);
    }
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}
