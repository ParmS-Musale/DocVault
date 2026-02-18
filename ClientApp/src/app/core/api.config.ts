import { InjectionToken, Provider } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export function provideApiBaseUrl(url?: string): Provider {
  const value =
    url ??
    (typeof window !== 'undefined' && (window as any).__DOCVAULT_API_BASE_URL) ??
    'http://localhost:5055';
  return { provide: API_BASE_URL, useValue: value };
}
