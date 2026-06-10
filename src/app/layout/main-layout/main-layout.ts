import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  protected readonly collapsed = signal(false);

  constructor(
    protected readonly auth: AuthService,
    protected readonly theme: ThemeService
  ) {}

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
  }
}
