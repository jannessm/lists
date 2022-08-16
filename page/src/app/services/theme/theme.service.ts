import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = new ReplaySubject<boolean>(1);

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.updateTheme(e.matches);
    });

    this.updateTheme();
  }

  updateTheme(isDark: boolean | null = null) {
    if (isDark === null) {
      this.isDark.next(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      this.isDark.next(isDark);
    }
  }
}

