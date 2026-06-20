import { Injectable, signal, effect, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

const THEME_KEY = 'sahl_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readTheme() === 'dark');
  private readonly router = inject(Router);
  private isLoginPage = false;

  constructor() {
    // Listen to router events to force Light Mode on Login page
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isLoginPage = event.urlAfterRedirects.includes('/login');
        this.applyTheme();
      }
    });

    effect(() => {
      // Re-apply when isDark changes
      this.isDark();
      this.applyTheme();
    });
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  private applyTheme(): void {
    if (this.isLoginPage) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    }
  }

  private readTheme(): string {
    return localStorage.getItem(THEME_KEY) ?? 'dark';
  }
}
