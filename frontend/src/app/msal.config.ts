import { PublicClientApplication, InteractionType } from "@azure/msal-browser";
import {
  MsalInterceptorConfiguration,
  MsalGuardConfiguration,
} from "@azure/msal-angular";
import { BrowserCacheLocation } from "@azure/msal-browser";

const ANGULAR_CLIENT_ID = "5531da29-4026-4ec0-b32b-1e080dcf505c";
const TENANT_ID = "1ab85098-b091-44d7-b9c0-f294a9b5ac88";

const API_CLIENT_ID = "9ddfe1ae-4b5a-4b87-85a7-4b4885b06dde";

const REDIRECT_URI =
  "https://happy-bay-0da833d00.2.azurestaticapps.net";

const API_SCOPE =
  "api://9ddfe1ae-4b5a-4b87-85a7-4b4885b06dde/access_as_user";

const API_BASE_URL =
  "https://docvault-api-app-gxevfbh9e3gya0ck.centralindia-01.azurewebsites.net/api";

export function msalInstanceFactory() {
  return new PublicClientApplication({
    auth: {
      clientId: ANGULAR_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      redirectUri: REDIRECT_URI,
      postLogoutRedirectUri: REDIRECT_URI,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, string[]>();

  protectedResourceMap.set(API_BASE_URL, [API_SCOPE]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [API_SCOPE],
    },
  };
}

export const loginRequest = {
  scopes: [API_SCOPE],
};