import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { delay } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { ThemeService } from './services/theme/theme.service';
import { UpdateService } from './services/update/update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
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
    public authService: AuthService,
    public router: Router,
    private updateService: UpdateService,
    private themeService: ThemeService) {
      themeService.isDark.subscribe(this.setTheme)
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
    } else {
      this.marginTopContent = 64;
      this.refreshOpacity = 1;
      this.loading = true;
      this.animationState = 'go';

      this.updateService.updateData().pipe(delay(500)).subscribe(() => {
        this.loading = false;
        this.marginTopContent = -1;
        this.refreshOpacity = 0;
      });
    }
  }

  @HostListener('touchmove', ['$event'])
  negativeScrollTouch(e: TouchEvent) {
    let clientY = e.changedTouches[0].clientY;
    if (this.scrollTop === 0 && this.startPos - clientY < 0) {
      this.marginTopContent = (clientY - this.startPos) / 3;

      this.refreshOpacity = (clientY - this.startPos) < 200 ? 0.005 * (clientY - this.startPos) / 3 : 1;
    }
  }
  
  @HostListener('mousemove', ['$event'])
  negativeScroll(e: MouseEvent) {
    let clientY = e.clientY;
    if (this.scrollTop === 0 && this.startPos - clientY < 0) {
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
