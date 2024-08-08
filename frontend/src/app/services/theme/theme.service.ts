import { Injectable, Signal, WritableSignal, signal } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { THEME } from '../../mydb/types/me';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark: WritableSignal<boolean>;
  userPreference: THEME = THEME.AUTO;

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.updateTheme();
    });

    this.isDark = signal(window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.updateTheme();
  }

  updateTheme(userPreference?: THEME) {
    if (userPreference) {
      this.userPreference = userPreference;
    }

    let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // evaluate userPreference if it is not auto
    if (this.userPreference !== THEME.AUTO) {
      isDark = this.userPreference === THEME.DARK;
    }

    this.isDark.set(isDark);

    const metaTag = document.querySelector('meta[name=theme-color]');
    if (metaTag) {
      metaTag.setAttribute('content', isDark ? '#262626' : '#ffffff');
    }
  }
}

