import { signal } from '@angular/core';
import { ReminderOption } from '../../components/selects/date-chip-select/options';
import { of } from 'rxjs';

export class AuthServiceSpy {
  me = signal(new MockMyMeDocument());
  pendingEmail = signal<string | null>(null);

  login = jasmine.createSpy('login').and.returnValue(of('code_sent'));
  shareLists = jasmine.createSpy('shareLists').and.returnValue(of(true));
  unshareLists = jasmine.createSpy('unshareLists').and.returnValue(of(true));
  changeEmail = jasmine.createSpy('changeEmail').and.returnValue(of(true));
  logout = jasmine.createSpy('logout').and.returnValue(of(true));
  verifyCode = jasmine.createSpy('verifyCode').and.returnValue(of({ success: true }));
  resendCode = jasmine.createSpy('resendCode').and.returnValue(of(true));
}


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

export class MockMyListsDocument {
  name = 'test';
  patch = () => Promise.resolve();
  isCreated = () => true;

  constructor(public isShoppingList = false) { }
}

export class MockMyItemDocument {
  id = 'asdf';
  done = false;
  touched = false;
  due = null;
  reminder = null;
  createdBy = 'asdf';
  _deleted = false;
  patch = () => Promise.resolve();
  remove = () => {this._deleted = true; return Promise.resolve()};
  links = () => [];
}
