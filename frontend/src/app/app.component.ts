import { Component, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { v4 as uuid } from 'uuid';
import { AuthService } from './services/auth/auth.service';
import { MaterialModule } from './material.module';
import { PusherService } from './services/pusher/pusher.service';
import { ThemeService } from './services/theme/theme.service';
import { DataService } from './services/data/data.service';

import { SwUpdate } from '@angular/service-worker';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ConfirmSheetComponent } from './components/bottom-sheets/confirm-sheet/confirm-sheet.component';
import { WebPushService } from './services/web-push/web-push.service';
import { IosService } from './services/ios/ios.service';
import { ReplicationService } from './services/replication/replication.service';

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
  refreshOpacity = 0;
  animationState = 'start';
  loading = false;

  @HostListener('document:pageshow', ['event'])
  @HostListener('document:focus', ['event'])
  resync() {
    if (this.replicationService.lastPusherState) {
      this.authService.refreshCSRF().subscribe(()=>{
        setTimeout(() => {
          console.log('resync after csrf');
          Object.values(this.replicationService.streamSubjects).forEach(subj => {
            subj.next('RESYNC');
          });
        }, 500);
      });

    }
  }

  constructor(
    public pusher: PusherService,
    public authService: AuthService,
    public dataService: DataService,
    public router: Router,
    private themeService: ThemeService,
    private cookieService: CookieService,
    private swUpdate: SwUpdate,
    private bottomSheet: MatBottomSheet,
    private webPush: WebPushService,
    private iosService: IosService,
    private replicationService: ReplicationService
  ) {
    effect(() => {
      this.setTheme(this.themeService.isDark());
    });

    if (!this.cookieService.check('listsId')) {
      this.cookieService.set('listsId', uuid(), 365);
    }

    if (!!(screen.orientation as any).lock) {
      (screen.orientation as any).lock("portrait").catch(() => {});
    }

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_DETECTED') {
          this.showAppUpdateAlert();
        }
      })
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

  setTheme(dark: boolean) {
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  showAppUpdateAlert() {
    const sheetRef = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Ein Update ist verfügbar! Jetzt laden?'});

    sheetRef.afterDismissed().subscribe(update => {
      if (update) {
        this.doAppUpdate();
      }
    });
  }

  doAppUpdate() {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
