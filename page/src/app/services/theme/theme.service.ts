import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = new ReplaySubject<boolean>(1);
  userPreference: boolean | null = null;

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.updateTheme();
    });

    this.updateTheme();
  }

  updateTheme() {
    let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (this.userPreference !== null) {
      isDark = this.userPreference;
    }

    this.isDark.next(isDark);

    const metaTag = document.querySelector('meta[name=theme-color]');
    if (metaTag) {
      metaTag.setAttribute('content', isDark ? '#262626' : '#ffffff');
    }
  }
}

