import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthApiService } from '../auth-api/auth-api.service';
import { REGISTER, SESSION_COOKIE } from '../../globals';
import md5 from 'md5-ts';
import { Router } from '@angular/router';
import { Observable, map, debounceTime, of } from 'rxjs';
import { AuthResponse, ChangeEmailStatus, VerifyCodeResponse } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MyMeDocument } from '../../mydb/types/me';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn: WritableSignal<boolean>;

  /** Set to the email address while waiting for code verification. */
  pendingEmail: WritableSignal<string | null> = signal(null);

  me: WritableSignal<MyMeDocument | undefined> = signal(undefined);

  constructor(private cookies: CookieService,
              private api: AuthApiService,
              private router: Router,
              private pusher: PusherService,
              private dataService: DataService,
              private snackBar: MatSnackBar) {
    this.dataService.db.me.findOne().$.subscribe((me: unknown) => {
      this.me.set(me as MyMeDocument);
    }
  );
    this.isLoggedIn = signal(this.cookies.check(SESSION_COOKIE));
    this.checkInit();

    effect(() => {
      if (this.isLoggedIn()) {
        this.setSessionCookie();
        this.dataService.initDB();
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

    this.pusher.online.subscribe(isOnline => {
      if (isOnline) {
        this.api.refreshCSRF().subscribe(()=>{});
      }
    });
  }

  /**
   * Passwordless login: sends a magic link code to the user's email.
   * Returns `'code_sent'` on success, `false` on error.
   */
  login(email: string): Observable<'code_sent' | false> {
    if (this.cookies.check(SESSION_COOKIE)) {
      this.cookies.delete(SESSION_COOKIE);
    }

    return this.api.login(email).pipe(
      map(result => {
        if (result === 'code_sent') {
          this.pendingEmail.set(email);
          this.router.navigateByUrl('/verify-code');
          return 'code_sent';
        }
        return false;
      })
    );
  }

  checkInit() {
    if (this.isLoggedIn() && !this.dataService.dbInitialized) {
      this.dataService.initDB();
    } else if (!this.isLoggedIn()) {
      this.deleteSessionCookie();
      this.pusher.unsubscribe();
      this.dataService.removeData();
    }
  }

  register(
    name: string,
    email: string,
    email_confirmation: string,
    captcha: string
  ): Observable<AuthResponse | REGISTER> {
    return this.api.register(
      name,
      email,
      email_confirmation,
      captcha
    ).pipe(
      map(res => {
        if (res === REGISTER.SUCCESS) {
          this.pendingEmail.set(email);
          this.router.navigateByUrl('/verify-code');
        }
        return res;
      })
    );
  }

  /**
   * Verify the 6-character code entered by the user.
   */
  verifyCode(code: string): Observable<VerifyCodeResponse> {
    const email = this.pendingEmail();
    if (!email) {
      return of({ error: 'no_pending_email' } as VerifyCodeResponse);
    }

    return this.api.verifyCode(email, code).pipe(
      map(res => {
        if (res.success) {
          this.pendingEmail.set(null);
          this.isLoggedIn.set(true);
          this.router.navigateByUrl('/user/lists');
        }
        return res;
      })
    );
  }

  /**
   * Resend the magic link code to the pending email.
   */
  resendCode(): Observable<boolean> {
    const email = this.pendingEmail();
    if (!email) return of(false);
    return this.api.resendCode(email);
  }

  logout() {
    this.api.logout().subscribe(success => {
      if (success) {
        this.setLoggedOut();
      }
    });
  }

  setLoggedOut() {
    this.isLoggedIn.set(false);
    this.router.navigateByUrl('/login');
  }

  setSessionCookie() {
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + 3);

    this.cookies.set(SESSION_COOKIE, md5(Math.random().toString()), expiration);
  }

  deleteSessionCookie() {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() - 1);

    this.cookies.set(SESSION_COOKIE, md5(Math.random().toString()), expiration);
  }

  changeEmail(newEmail: string): Observable<ChangeEmailStatus> {
    return this.api.changeEmail(newEmail);
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

  refreshCSRF() {
    return this.api.refreshCSRF();
  }
}

