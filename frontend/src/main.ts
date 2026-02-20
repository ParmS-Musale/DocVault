import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { msalInstanceFactory } from 'src/app/msal.config';
import { MSAL_INSTANCE } from '@azure/msal-angular';

async function main() {
  const msalInstance = msalInstanceFactory();

  await msalInstance.initialize();

  // ✅ Handle redirect response (after login) - This must happen BEFORE bootstrap to avoid race conditions with MsalGuard
  try {
    const authResult = await msalInstance.handleRedirectPromise();
    if (authResult?.account) {
      msalInstance.setActiveAccount(authResult.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  } catch (error) {
    console.error("❌ MSAL redirect error:", error);
  }

  await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      ...(appConfig.providers ?? []),
      { provide: MSAL_INSTANCE, useValue: msalInstance }
    ]
  });
}

main().catch(err => console.error(err));
