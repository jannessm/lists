import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = new ReplaySubject<boolean>(1);

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDark.next(e.matches);
    });

    if(window.matchMedia('(prefers-color-scheme: dark)').matches){
      this.isDark.next(true);
    } else {
      this.isDark.next(false);
    }
  }
}
