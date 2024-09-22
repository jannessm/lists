import { Injectable, Signal, WritableSignal, effect, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthApiService } from '../auth-api/auth-api.service';
import { REGISTER, SESSION_COOKIE } from '../../globals';
import md5 from 'md5-ts';
import { Router } from '@angular/router';
import { Observable, map, debounceTime, of } from 'rxjs';
import { AuthResponse, ChangeEmailStatus } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { VerifyMailComponent } from '../../components/bottom-sheets/verify-mail/verify-mail.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MyMeDocument } from '../../mydb/types/me';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn: WritableSignal<boolean>;

  me: Signal<MyMeDocument>;

  verificationInverval: undefined | any;

  constructor(private cookies: CookieService,
              private api: AuthApiService,
              private router: Router,
              private pusher: PusherService,
              private dataService: DataService,
              private bottomsheet: MatBottomSheet,
              private snackBar: MatSnackBar) {
    this.me = this.dataService.db.me.findOne().$$;
    this.isLoggedIn = signal(this.cookies.check(SESSION_COOKIE));
    
    effect(() => {
      if (this.isLoggedIn()) {
        this.setSessionCookie();
        this.dataService.initDB(null);
        setTimeout(() => {
          if (!this.router.url.startsWith('/user')) {
            this.router.navigateByUrl('/user/lists');
          }
        }, 100);
      } else {
        this.deleteSessionCookie();
        this.pusher.unsubscribe();
        this.dataService.removeData();
        setTimeout(() => {
          if (this.router.url.startsWith('/user')) {
            this.router.navigateByUrl('/login');
          }
        }, 100);
      }
    });
    
    this.api.validateLogin().subscribe(loggedIn => {
      if (loggedIn !== 'error') {
        this.isLoggedIn.set(!!loggedIn);
      }
    });

    this.pusher.online.pipe(debounceTime(1000)).subscribe(isOnline => {
      if (isOnline && this.isLoggedIn()) {
        this.evaluateVerifiedMail();
      }
    })
  }

  login(email: string, password: string, captcha: string): Observable<boolean> {
    if (this.cookies.check(SESSION_COOKIE)) {
      this.cookies.delete(SESSION_COOKIE);
    }

    return this.api.login(email, password, captcha).pipe(
      map(success => {
        if (success) {
          this.isLoggedIn.set(true);

          this.router.navigateByUrl('/user/lists');

          return true;
        } else {
          this.isLoggedIn.set(false);

          return false;
        }
    }));
  }

  register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    captcha: string
  ): Observable<AuthResponse | REGISTER> {
    return this.api.register(
      name,
      email,
      password,
      password_confirmation,
      captcha
    ).pipe(
      map(res => {
        if (res === REGISTER.SUCCESS) {
          this.isLoggedIn.set(true);
        }

        return res;
      })
    );
  }

  logout() {
    this.api.logout().subscribe(success => {
      if (success) {
        this.isLoggedIn.set(false);
        this.router.navigateByUrl('/login');
      }
    });
  }

  setSessionCookie() {
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + 3);

    this.cookies.set(SESSION_COOKIE, md5(Math.random().toString()), expiration);
  }

  deleteSessionCookie() {
    const expiration = new Date();
    expiration.setMonth(expiration.getFullYear() - 1);

    this.cookies.set(SESSION_COOKIE, md5(Math.random().toString()), expiration);
  }

  evaluateVerifiedMail() {
    const lastVerification = localStorage.getItem('lastVerification');
    let lastVerificationDate: Date = new Date();

    if (!!lastVerification) {
      lastVerificationDate = new Date(lastVerification);
    } else {
      lastVerificationDate.setDate(lastVerificationDate.getDate() - 2);
    }

    const now = new Date();
    if (now.valueOf() - lastVerificationDate.valueOf() > 24 * 60 * 60 * 1000) {
      localStorage.setItem('lastVerification', now.toISOString());

      this.api.verifyEmail().subscribe(verified => {
        if (!verified) {
          const dialogRef = this.bottomsheet.open(VerifyMailComponent);
          dialogRef.afterDismissed().subscribe(sendMail => {
            if (sendMail) {
              this.api.resendVerificationMail().subscribe(() => {
                this.snackBar.open('Email wurde versendet.', 'OK');
              });
            }
          })
        }
      });
    }
  }

  changeEmail(newEmail: string): Observable<ChangeEmailStatus> {
    return this.api.changeEmail(newEmail);
  }

  changePwd(current_password: string, password: string, password_confirmation: string) {
    return this.api.changePwd(current_password, password, password_confirmation);
  }

  forgotPwd(email: string) {
    return this.api.forgotPwd(email);
  }

  resetPwd(
    token: string, email: string,
    password: string, password_confirmation: string
  ) {
    return this.api.resetPwd(token, email, password, password_confirmation);
  }

  shareLists(email: string, listsId: string) {
    return this.api.shareLists(email, listsId);
  }

  unshareLists(userId: string, listsId: string) {
    return this.api.unshareLists(userId, listsId);
  }

  pushSubscribe(sub: PushSubscription) {
    const json = sub.toJSON();
    if (json.endpoint && json.keys) {
      return this.api.pushSubscribe(
        json.endpoint,
        json.keys['p256dh'],
        json.keys['auth']
      );
    }
    return of(false);
  }
}
