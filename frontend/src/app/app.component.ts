import { Component, OnInit, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TopBarComponent } from "./components/shared/top-bar/top-bar.component";

import { MsalService } from "@azure/msal-angular";
import { AuthenticationResult } from "@azure/msal-browser";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, TopBarComponent],
	template: `
    <div class="app-layout">
      <!-- <app-sidebar class="sidebar" /> -->
      <div class="main-wrapper">
        <app-top-bar />
        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
	`,
	styles: [
		`
      .app-layout {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }

      /* Sidebar removed */

      .main-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .content-area {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        background-color: var(--bg-app);
      }
		`,
	],
})
export class AppComponent implements OnInit {
	private readonly msalService = inject(MsalService);

	async ngOnInit(): Promise<void> {
		console.log("🔐 AppComponent initialized");

		try {
			// ℹ️ Redirect is handled in main.ts to avoid race conditions

				const activeAccount =
					this.msalService.instance.getActiveAccount();

				// ✅ If already logged in → continue
				if (activeAccount) {
					console.log("👤 Active account:", activeAccount.username);
					return;
				}

				const allAccounts = this.msalService.instance.getAllAccounts();

				// ✅ Restore previous session
				if (allAccounts.length > 0) {
					console.log("♻ Restoring existing session");
					this.msalService.instance.setActiveAccount(allAccounts[0]);
					return;
				}

				// 🚨 No session → let MsalGuard handle it for protected routes
				console.log("ℹ️ No active session. Letting MsalGuard handle protection.");
		} catch (error) {
			console.error("❌ MSAL redirect error:", error);
		}
	}
}
