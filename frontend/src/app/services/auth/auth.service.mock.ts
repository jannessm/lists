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
import { ReminderOption } from '../../components/selects/date-chip-select/options';

export class MockMyMeDocument {
  id = 'abc';
  name = 'test';
  email = 'test@test';
  emailVerifiedAt = null;
  lists = ['list1', 'list2'];
  theme = 'auto';
  defaultReminder = ReminderOption.MIN_30;
  _deleted = false;
  updatedAt = '2024-10-01T18:32:00.000Z';
  createdAt = '2024-09-01T18:32:00.000Z';
  hasLists = (id: string) => !!this.lists.find(v => v === id);
  touched = false;
  patch = () => Promise.resolve();
  remove = () => {this._deleted = true; return Promise.resolve()}
}

export class MockAuthService {
  isLoggedIn: WritableSignal<boolean> = signal(true);

  me: Signal<MyMeDocument> = signal(MockMyMeDocument as unknown as MyMeDocument);

  verificationInverval: undefined | any;

  login = (email: string, password: string, captcha: string): Observable<boolean> => of(true);

  register = (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    captcha: string
  ): Observable<AuthResponse | REGISTER> => of(REGISTER.SUCCESS);

  logout = () => of();

  changeEmail = (newEmail: string): Observable<ChangeEmailStatus> {
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
