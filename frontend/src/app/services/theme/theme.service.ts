import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { THEME } from '../../mydb/types/me';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark: WritableSignal<boolean>;
  userPreference: WritableSignal<THEME> = signal(THEME.AUTO);

  constructor(private authService: AuthService) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.updateTheme();
    });

    this.isDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.updateTheme();

    effect(() => {
      if (this.authService.me()) {
        setTimeout(() => {
          this.updateTheme(this.authService.me()?.theme as THEME);
        });
      }
    })
  }

  updateTheme(userPreference?: THEME) {
    if (userPreference) {
      this.userPreference.set(userPreference);
    }

    let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // evaluate userPreference if it is not auto
    if (this.userPreference() !== THEME.AUTO) {
      isDark = this.userPreference() === THEME.DARK;
    }

    this.isDark.set(isDark);

    const metaTag = document.querySelector('meta[name=theme-color]');
    if (metaTag) {
      metaTag.setAttribute('content', isDark ? '#262626' : '#ffffff');
    }
  }
}

