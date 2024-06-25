import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
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
  animations: [
    [
      trigger('rotate', [
        state('start', style({
          transform: 'rotate(0deg)'
        })),
        state('go', style({
          transform: 'rotate(360deg)'
        })),
        transition('start => go', [
          animate('1s')
        ]),
      ])
    ]
  ]
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
    private snackBar: MatSnackBar,
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

  @HostListener('pointerdown', ['$event'])
  setStartPos(e: MouseEvent) {
    this.startPos = e.clientY;
    this.scrollTop = (<HTMLElement>e.target).scrollTop;
  }

  @HostListener('pointerup')
  @HostListener('touchend')
  clearPos() {
    this.startPos = 0;
    this.scrollTop = -1;

    if (this.refreshOpacity < 1) {
      this.marginTopContent = -1;
      this.refreshOpacity = 0;
    } else if (this.online) {
      this.marginTopContent = 64;
      this.refreshOpacity = 1;
      this.loading = true;
      this.animationState = 'go';

      // this.updateService.updateData().pipe(delay(500)).subscribe(() => {
      //   this.loading = false;
      //   this.marginTopContent = -1;
      //   this.refreshOpacity = 0;
      // });
    } else if (!this.online) {
      this.snackBar.open('Aktualisierung offline nicht möglich.', 'Ok');
      this.loading = false;
      this.marginTopContent = -1;
      this.refreshOpacity = 0;
    }
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

  @HostListener('touchmove', ['$event'])
  negativeScrollTouch(e: TouchEvent) {
    let clientY = e.changedTouches[0].clientY;
    const container = document.querySelector('.container') || document.querySelector('#items-container');
    const isTop = this.scrollTop === 0;
    const containerIsTop = container === null || (container !== null && container.scrollTop === 0);

    if (isTop && containerIsTop && this.startPos - clientY < 0) {
      this.marginTopContent = (clientY - this.startPos) / 3;

      this.refreshOpacity = (clientY - this.startPos) < 200 ? 0.005 * (clientY - this.startPos) / 3 : 1;
    }
  }
  
  @HostListener('mousemove', ['$event'])
  negativeScroll(e: MouseEvent) {
    let clientY = e.clientY;
    const container = document.querySelector('.container') || document.querySelector('#items-container');
    const isTop = this.scrollTop === 0;
    const containerIsTop = container === null || (container !== null && container.scrollTop === 0);

    if (isTop && containerIsTop && this.startPos - clientY < 0) {
      this.marginTopContent = (clientY - this.startPos) / 3;

      this.refreshOpacity = (clientY - this.startPos) < 200 ? 0.005 * (clientY - this.startPos) / 3 : 1;
    }
  }

  onEnd() {
    if (this.loading) {
      this.animationState = 'start';
      setTimeout(() => {this.animationState = 'go'}, 1);
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
