import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { v4 as uuid } from 'uuid';
import { AuthService } from './services/auth/auth.service';
import { MaterialModule } from './material.module';
import { PusherService } from './services/pusher/pusher.service';
import { ThemeService } from './services/theme/theme.service';
import { DataService } from './services/data/data.service';

/**
 * IMPORTANT: RxDB creates rxjs observables outside of angulars zone
 * So you have to import the rxjs patch to ensure changedetection works correctly.
 * @link https://www.bennadel.com/blog/3448-binding-rxjs-observable-sources-outside-of-the-ngzone-in-angular-6-0-2.htm
 */
import 'zone.js/plugins/zone-patch-rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MaterialModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Lists';
  startPos = 0;
  scrollTop = -1;
  marginTopContent = -1;
  refreshOpacity = 0;
  animationState = 'start';
  loading = false;

  constructor(
    public pusher: PusherService,
    public authService: AuthService,
    public dataService: DataService,
    public router: Router,
    private themeService: ThemeService,
    private cookieService: CookieService,
    private http: HttpClient) {
      themeService.isDark.subscribe(this.setTheme);

      if (!this.cookieService.check('listsId')) {
        this.cookieService.set('listsId', uuid(), 365);
      }

      (screen.orientation as any).lock("portrait");
  }

  ngAfterViewChecked(): void {
    const urlParts = window.location.href.split('#');

    if (urlParts.length > 1) {
      try {
        const elem = document.querySelector('#' + urlParts[1]);
  
        if (elem && !elem.classList.contains('highlight')) {
          elem.scrollIntoView({ behavior: "smooth", block: "start"});
          elem.classList.add('highlight')
        }
      } catch (e) {console.log(e)}
    }
  }

  setTheme(dark: boolean) {
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
