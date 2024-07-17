import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { v4 as uuid } from 'uuid';
import { AuthService } from './services/auth/auth.service';
import { MaterialModule } from './material.module';
import { PusherService } from './services/pusher/pusher.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from './services/theme/theme.service';
import { DataService } from './services/data/data.service';

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
  online = false;

  constructor(
    public pusher: PusherService,
    public authService: AuthService,
    public dataService: DataService,
    public router: Router,
    private themeService: ThemeService,
    private cookieService: CookieService) {
      themeService.isDark.subscribe(this.setTheme);

      if (!this.cookieService.check('listsId')) {
        this.cookieService.set('listsId', uuid(), 365);
      }

      (screen.orientation as any).lock("portrait");

      this.pusher.online.subscribe(isOnline => {
        this.online = isOnline;
      })
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
