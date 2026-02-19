import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/shared/nav/nav.component';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Root application shell.
 * Hosts the navigation bar and router outlet.
 * Standalone – no NgModules required.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, MatToolbarModule],
  template: `
    <app-nav />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 64px);
      background: var(--bg-surface);
    }
  `]
})
export class AppComponent {
  title = 'DocVault';
}
