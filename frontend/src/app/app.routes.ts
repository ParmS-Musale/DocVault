import { Routes } from "@angular/router";
import { MsalGuard } from "@azure/msal-angular";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
  {
    path: "home",
    canActivate: [MsalGuard],
    loadComponent: () =>
      import("./components/home/home.component").then(
        (m) => m.HomeComponent
      ),
  },
  {
    path: "upload",
    canActivate: [MsalGuard],
    loadComponent: () =>
      import("./components/upload/upload.component").then(
        (m) => m.UploadComponent
      ),
  },
  {
    path: "documents",
    canActivate: [MsalGuard],
    loadComponent: () =>
      import("./components/document-list/document-list.component").then(
        (m) => m.DocumentListComponent
      ),
  },
  {
    path: "**",
    redirectTo: "home",
  },
];
