import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";

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
    MatChipsModule,
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

      <section class="stack-section">
        <h3>Built With</h3>

        <div class="stack-chips">
          @for (tech of techStack; track tech.label) {
            <mat-chip [style.background]="tech.color">
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
      padding: 32px 24px 60px;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.04);
      margin-bottom: 22px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .hero {
      text-align: center;
      margin-top: 10px;
    }

    .hero-icon-wrap {
      width: 70px;
      height: 70px;
      margin: 0 auto 14px;
      border-radius: 18px;
      background: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-icon {
      font-size: 38px;
      color: #3f51b5;
    }

    .hero-title {
      font-size: 32px;
      margin: 10px 0;
      font-weight: 600;
    }

    .brand {
      color: #3f51b5;
    }

    .hero-subtitle {
      max-width: 620px;
      margin: 0 auto 20px;
      color: #666;
      font-size: 15px;
    }

    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .health-banner {
      margin: 24px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .healthy {
      color: #43a047;
    }

    .features {
      margin-top: 26px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 18px;
    }

    .feature-card {
      padding: 20px;
      border-radius: 16px;
      text-align: left;
    }

    .feature-card mat-icon {
      color: #3f51b5;
    }

    .feature-card h3 {
      margin: 8px 0 4px;
      font-size: 16px;
    }

    .feature-card p {
      margin: 0 0 10px;
      color: #777;
      font-size: 13px;
    }

    .feature-card a {
      font-size: 13px;
      font-weight: 500;
      color: #3f51b5;
      text-decoration: none;
    }

    .disabled-link {
      color: #999;
      font-size: 13px;
    }

    .stack-section {
      text-align: center;
      margin-top: 30px;
    }

    .stack-chips {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    mat-chip {
      color: white;
      font-size: 12px;
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly docService = inject(DocumentService);
  private readonly msalService = inject(MsalService);

  health = signal<HealthDto | null>(null);
  user = signal<AccountInfo | null>(null);

  readonly techStack = [
    { label: "Angular 17+", color: "#dd1b16" },
    { label: "Angular Material", color: "#7b1fa2" },
    { label: ".NET 8 Web API", color: "#512bd4" },
    { label: "Azure Blob Storage", color: "#0072c6" },
    { label: "Azure Cosmos DB", color: "#00bcf2" },
  ];

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
