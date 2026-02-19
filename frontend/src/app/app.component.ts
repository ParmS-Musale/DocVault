import { Component, OnInit, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavComponent } from "./components/shared/nav/nav.component";
import { MatToolbarModule } from "@angular/material/toolbar";

import { MsalService } from "@azure/msal-angular";
import { AuthenticationResult } from "@azure/msal-browser";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, NavComponent, MatToolbarModule],
	template: `
		<app-nav />
		<main class="main-content">
			<router-outlet />
		</main>
	`,
	styles: [
		`
			.main-content {
				min-height: calc(100vh - 64px);
				background: var(--bg-surface);
			}
		`,
	],
})
export class AppComponent implements OnInit {
	private readonly msalService = inject(MsalService);

	async ngOnInit(): Promise<void> {
		console.log("🔐 AppComponent initialized");

		try {
			// ✅ Initialize MSAL before using it
			await this.msalService.instance.initialize();

			// ✅ Handle redirect response (after login)
			const result = await this.msalService.instance.handleRedirectPromise();
				if (result?.account) {
					console.log(
						"✅ Redirect login success:",
						result.account.username,
					);

					this.msalService.instance.setActiveAccount(result.account);
				}

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
