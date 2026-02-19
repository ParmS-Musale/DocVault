import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from "@angular/common/http";
import { MsalInterceptor } from "@azure/msal-angular";
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule } from "@angular/platform-browser";
import { MsalModule } from "@azure/msal-angular";
import { msalInstanceFactory, msalGuardConfigFactory, msalInterceptorConfigFactory } from "./msal.config";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    provideAnimations(),

    importProvidersFrom(
      MsalModule.forRoot(
        msalInstanceFactory(),
        msalGuardConfigFactory(),
        msalInterceptorConfigFactory()
      )
    )
  ]
};