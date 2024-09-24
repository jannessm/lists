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
