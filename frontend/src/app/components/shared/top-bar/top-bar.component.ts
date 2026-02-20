import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MsalService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <header class="top-bar">
      
      <!-- Brand / Logo -->
      <div class="brand-area" routerLink="/home">
        <mat-icon class="brand-icon">folder_special</mat-icon>
        <span class="brand-name">DocVault</span>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-links">
        <a routerLink="/home" routerLinkActive="active" class="nav-item">
          <mat-icon>home</mat-icon>
          <span>Home</span>
        </a>
        <a routerLink="/upload" routerLinkActive="active" class="nav-item">
          <mat-icon>cloud_upload</mat-icon>
          <span>Upload</span>
        </a>
        <a routerLink="/documents" routerLinkActive="active" class="nav-item">
          <mat-icon>folder_open</mat-icon>
          <span>View Documents</span>
        </a>
      </nav>

      <!-- User Actions -->
      <div class="actions-area">
        <button mat-icon-button class="notification-btn">
          <mat-icon>notifications</mat-icon>
        </button>
        
        @if (userName()) {
          <div class="profile-menu" [matMenuTriggerFor]="userMenu">
            <div class="avatar">{{ userInitial() }}</div>
            <span class="username">{{ userName() }}</span>
            <mat-icon>expand_more</mat-icon>
          </div>
        } @else {
          <button mat-stroked-button color="primary" (click)="login()">
            <mat-icon>login</mat-icon>
            Login with Microsoft
          </button>
        }

        <mat-menu #userMenu="matMenu">
          <button mat-menu-item>
            <mat-icon>account_circle</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .top-bar {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    /* Brand */
    .brand-area {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      margin-right: 3rem;
    }

    .brand-icon { 
      color: var(--primary); 
      font-size: 28px; 
      width: 28px; 
      height: 28px; 
    }
    
    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.5px;
    }

    /* Navigation */
    .nav-links {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: var(--bg-input);
      color: var(--text-main);
    }

    .nav-item.active {
      background: rgba(79, 70, 229, 0.1);
      color: var(--primary);
      font-weight: 600;
    }

    .nav-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Actions */
    .actions-area {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .notification-btn {
      color: var(--text-secondary);
    }

    .profile-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md);
      transition: background-color 0.2s ease;
    }

    .profile-menu:hover {
      background-color: var(--bg-input);
    }

    .avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .username {
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-main);
    }
  `]
})
export class TopBarComponent implements OnInit {
  private readonly msalService = inject(MsalService);

  userName = signal<string | null>(null);
  userInitial = signal<string>('U');

  ngOnInit(): void {
    this.setUsername();

    this.msalService.instance.addEventCallback((event: EventMessage) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACCOUNT_ADDED
      ) {
        const payload = event.payload as any;
        this.msalService.instance.setActiveAccount(payload.account);
        this.setUsername();
      }
      
      if (
        event.eventType === EventType.LOGOUT_SUCCESS || 
        event.eventType === EventType.ACCOUNT_REMOVED
      ) {
        this.userName.set(null);
        this.userInitial.set('U');
      }
    });
  }

  private setUsername() {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.userName.set(account.name || account.username);
      this.userInitial.set(account.name ? account.name.charAt(0).toUpperCase() : 'U');
    } else {
      this.userName.set(null);
      this.userInitial.set('U');
    }
  }

  login() {
    this.msalService.loginRedirect();
  }

  logout() {
    this.msalService.logoutRedirect();
  }
}
