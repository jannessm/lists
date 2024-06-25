import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { THEME } from '../../../models/rxdb/me';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = new ReplaySubject<boolean>(1);
  userPreference: THEME = THEME.AUTO;

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.updateTheme();
    });

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

    this.isDark.next(isDark);

    const metaTag = document.querySelector('meta[name=theme-color]');
    if (metaTag) {
      metaTag.setAttribute('content', isDark ? '#262626' : '#ffffff');
    }
  }
}

