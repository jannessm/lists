import { Injectable, Signal, WritableSignal, effect, signal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthApiService } from '../auth-api/auth-api.service';
import { REGISTER, SESSION_COOKIE } from '../../globals';
import dayjs from 'dayjs';
import md5 from 'md5-ts';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthResponse, ChangeEmailStatus } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { VerifyMailComponent } from '../../components/bottom-sheets/verify-mail/verify-mail.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
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
              private snackBar: MatSnackBar,
              private location: Location) {
    this.me = this.dataService.db.me.findOne().$$;
    this.isLoggedIn = signal(this.cookies.check(SESSION_COOKIE));
    
    effect(() => {
      if (this.isLoggedIn()) {
        this.setSessionCookie();
        this.dataService.initDB(null);
      } else {
        this.deleteSessionCookie();
        this.pusher.unsubscribe();
        this.dataService.removeData();
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 100);
      }
    });
    
    this.api.validateLogin().subscribe(loggedIn => {
      this.isLoggedIn.set(!!loggedIn);
    });

    this.pusher.online.subscribe(isOnline => {
      if (isOnline && this.isLoggedIn()) {
        this.evaluateVerifiedMail();
        this.verificationInverval = setInterval(this.evaluateVerifiedMail.bind(this), 5 * 60 * 1000);
      } else {
        if (this.verificationInverval) {
          clearInterval(this.verificationInverval);
        }
      }
    })
  }

  login(email: string, password: string): Observable<boolean> {
    if (this.cookies.check(SESSION_COOKIE)) {
      this.cookies.delete(SESSION_COOKIE);
    }

    return this.api.login(email, password).pipe(
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
    password_confirmation: string
  ): Observable<AuthResponse | REGISTER> {
    return this.api.register(name, email, password, password_confirmation).pipe(
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
    const expiration = dayjs().add(3, 'y').toDate();

    this.cookies.set(SESSION_COOKIE, md5('coolToken'), expiration);
  }

  deleteSessionCookie() {
    const expiration = dayjs().subtract(3, 'y').toDate();

    this.cookies.set(SESSION_COOKIE, md5('coolToken'), expiration);
  }

  evaluateVerifiedMail() {
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
}
