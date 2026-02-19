import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { msalInstanceFactory } from 'src/app/msal.config';
import { MSAL_INSTANCE } from '@azure/msal-angular';

async function main() {
  const msalInstance = msalInstanceFactory();

  await msalInstance.initialize();

  await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      ...(appConfig.providers ?? []),
      { provide: MSAL_INSTANCE, useValue: msalInstance }
    ]
  });
}

main().catch(err => console.error(err));
