import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthApiService } from '../auth-api/auth-api.service';
import { REGISTER, SESSION_COOKIE } from '../../globals';
import dayjs from 'dayjs';
import md5 from 'md5-ts';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuthResponse } from '../../../models/responses';
import { PusherService } from '../pusher/pusher.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn: BehaviorSubject<boolean>;

  // store the URL so we can redirect after logging in
  redirectUrl: string | null = null;

  constructor(private cookies: CookieService,
              private api: AuthApiService,
              private router: Router,
              private pusher: PusherService) {
    this.isLoggedIn = new BehaviorSubject<boolean>(this.cookies.check(SESSION_COOKIE));
    this.isLoggedIn.subscribe(loggedIn => {
      if (loggedIn) {
        this.pusher.init();
      } else {
        this.pusher.unsubscribe();
      }
    });
    this.api.validateLogin().subscribe(this.isLoggedIn.next);
  }

  login(email: string, password: string): Observable<boolean> {
    if (this.cookies.check(SESSION_COOKIE)) {
      this.cookies.delete(SESSION_COOKIE);
    }

    return this.api.login(email, password).pipe(
      map(success => {
      if (success) {
        const expiration = dayjs().add(3, 'y').toDate();

        this.cookies.set(SESSION_COOKIE, md5('coolToken'), expiration);
        this.isLoggedIn.next(true);

        this.router.navigateByUrl('');

        return true;
      } else {
        this.isLoggedIn.next(false);

        return false;
      }
    }));
  }

  register(name: string, email: string, password: string, password_confirmation: string): Observable<AuthResponse | REGISTER> {
    return this.api.register(name, email, password, password_confirmation);
  }

  logout(): Observable<boolean> {
    return this.api.logout().pipe(
      map(success => {
        if (success) {
          this.cookies.delete(SESSION_COOKIE);
          this.isLoggedIn.next(false);
          this.router.navigateByUrl('/login');

          return true;
        } else {
          return false;
        }
      })
    );
  }
}
