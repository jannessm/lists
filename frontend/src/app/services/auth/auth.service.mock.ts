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

export class MockMyListsDocument {
  name = 'test';
  isShoppingList = false;
  patch = () => Promise.resolve();
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
}
