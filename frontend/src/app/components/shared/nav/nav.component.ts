import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { MsalService } from "@azure/msal-angular";
import { EventMessage, EventType } from "@azure/msal-browser";

@Component({
  selector: "app-nav",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">

      <span class="logo" routerLink="/home">
        <mat-icon>folder</mat-icon>
        DocVault
      </span>

      <div class="nav-links">
        <a mat-button routerLink="/home" routerLinkActive="active">
          <mat-icon>home</mat-icon>
          Home
        </a>

        <a mat-button routerLink="/upload" routerLinkActive="active">
          <mat-icon>cloud_upload</mat-icon>
          Upload
        </a>

        <a mat-button routerLink="/documents" routerLinkActive="active">
          <mat-icon>folder_open</mat-icon>
          Documents
        </a>
      </div>

      <span class="spacer"></span>

      @if (userName()) {
        <span class="user">
          <mat-icon>account_circle</mat-icon>
          {{ userName() }}
        </span>

        <button mat-button (click)="logout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      }

    </mat-toolbar>
  `,
  styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .nav-links {
      display: flex;
      gap: 6px;
    }

    .nav-links a.active {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 6px;
    }

    .spacer {
      flex: 1;
    }

    .user {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 8px;
      font-size: 14px;
    }

    button {
      color: white;
    }

    mat-icon {
      font-size: 20px;
    }

    @media (max-width: 768px) {
      .nav-links span {
        display: none;
      }

      .user {
        display: none;
      }
    }
  `],
})
export class NavComponent implements OnInit {
  private readonly msalService = inject(MsalService);

  userName = signal<string | null>(null);

  ngOnInit(): void {
    this.setUser();

    this.msalService.instance.addEventCallback((event: EventMessage) => {
      if (event.eventType === EventType.LOGIN_SUCCESS) {
        const payload = event.payload as any;
        this.msalService.instance.setActiveAccount(payload.account);
        this.setUser();
      }

      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        this.userName.set(null);
      }
    });
  }

  private setUser(): void {
    const account =
      this.msalService.instance.getActiveAccount() ??
      this.msalService.instance.getAllAccounts()[0];

    if (account) {
      this.userName.set(account.name ?? account.username);
    }
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}
