import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthApiService } from '../auth-api/auth-api.service';
import { REGISTER, SESSION_COOKIE } from '../../globals';
import dayjs from 'dayjs';
import md5 from 'md5-ts';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuthResponse, ChangeEmailStatus } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { VerifyMailComponent } from '../../components/bottom-sheets/verify-mail/verify-mail.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn: BehaviorSubject<boolean>;
  verifiedMail = new BehaviorSubject<boolean>(false);
  verificationInverval: undefined | any;

  // store the URL so we can redirect after logging in
  redirectUrl: string | null = null;

  constructor(private cookies: CookieService,
              private api: AuthApiService,
              private router: Router,
              private pusher: PusherService,
              private bottomsheet: MatBottomSheet,
              private snackBar: MatSnackBar,
              private location: Location) {
    this.isLoggedIn = new BehaviorSubject<boolean>(this.cookies.check(SESSION_COOKIE));
    
    this.isLoggedIn.subscribe(loggedIn => {
      if (loggedIn) {
        this.pusher.init();
        this.setSessionCookie();
      } else {
        this.pusher.unsubscribe();
        this.cookies.delete(SESSION_COOKIE);
      }

      this.router.navigateByUrl(location.path(), {skipLocationChange: true})
    });
    
    this.api.validateLogin().subscribe(loggedIn => {
      this.isLoggedIn.next(loggedIn);
    });

    this.pusher.online.subscribe(isOnline => {
      if (isOnline) {
        this.evaluateVerifiedMail();
        this.verificationInverval = setInterval(this.evaluateVerifiedMail, 5 * 60 * 1000);
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
        this.isLoggedIn.next(true);

        this.router.navigateByUrl('/user/lists');

        return true;
      } else {
        this.isLoggedIn.next(false);

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
          this.isLoggedIn.next(true);
        }

        return res;
      })
    );
  }

  logout() {
    this.api.logout().subscribe(success => {
      if (success) {
        this.isLoggedIn.next(false);
        this.router.navigateByUrl('/login');
      }
    });
  }

  setSessionCookie() {
    const expiration = dayjs().add(3, 'y').toDate();

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
}
