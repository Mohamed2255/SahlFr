import { Injectable, signal, effect } from '@angular/core';

const THEME_KEY = 'sahl_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readTheme() === 'dark');

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
      localStorage.setItem(THEME_KEY, this.isDark() ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  private readTheme(): string {
    return localStorage.getItem(THEME_KEY) ?? 'light';
  }
}
