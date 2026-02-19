import { PublicClientApplication, InteractionType } from "@azure/msal-browser";
import {
  MsalInterceptorConfiguration,
  MsalGuardConfiguration,
} from "@azure/msal-angular";
import { BrowserCacheLocation } from "@azure/msal-browser";

const ANGULAR_CLIENT_ID = "5531da29-4026-4ec0-b32b-1e080dcf505c";

const TENANT_ID = "1ab85098-b091-44d7-b9c0-f294a9b5ac88";

const API_CLIENT_ID = "9ddfe1ae-4b5a-4b87-85a7-4b4885b06dde";


export function msalInstanceFactory() {
  return new PublicClientApplication({
    auth: {
      clientId: ANGULAR_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      redirectUri: "http://localhost:4200",
      postLogoutRedirectUri: "http://localhost:4200",
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}


export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, string[]>();

  protectedResourceMap.set("http://localhost:5000/api", [
    `api://${API_CLIENT_ID}/access_as_user`,
  ]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}


export function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [`api://${API_CLIENT_ID}/access_as_user`],
    },
  };
}


export const loginRequest = {
  scopes: [`api://${API_CLIENT_ID}/access_as_user`],
};
