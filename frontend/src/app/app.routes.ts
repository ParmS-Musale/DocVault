import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./components/upload/upload.component').then(m => m.UploadComponent)
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./components/document-list/document-list.component').then(m => m.DocumentListComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
