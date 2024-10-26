import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent } from './list.component';
import { AuthService } from '../../services/auth/auth.service';
import { DataService } from '../../services/data/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, EventEmitter, Input, Output, Signal, signal, WritableSignal } from '@angular/core';
import { ListHeaderComponent } from './list-header/list-header.component';
import { ListItemComponent } from './list-item/list-item.component';
import { DateChipSelectComponent } from '../selects/date-chip-select/date-chip-select.component';
import { UsersService } from '../../services/users/users.service';
import { MyUsersDocument } from '../../mydb/types/users';
import { MyListsDocument } from '../../mydb/types/lists';
import { MyMeDocument } from '../../mydb/types/me';
import { MyItemDocument } from '../../mydb/types/list-item';
import { MockMyItemDocument } from '../../services/auth/auth.service.mock';

describe('ListComponent', () => {
  @Component({
    selector: "app-test",
    standalone: true,
    template: ``,
  })
  class TestComponent {}

  @Component({
    selector: "app-list-header",
    standalone: true,
    template: ``,
  })
  class TestHeaderComponent {
    @Input() lists!: Signal<MyListsDocument>;
    @Input() users: WritableSignal<MyUsersDocument[]> = signal([]);
    @Input() isAdmin = false;

    @Output() listToText = new EventEmitter<void>();
  }

  @Component({
    selector: "app-list-item",
    standalone: true,
    template: ``,
  })
  class TestItemComponent {
    @Input()
    me!: Signal<MyMeDocument>;
    @Input()
    list!: Signal<MyListsDocument>;
    @Input()
    item!: MyItemDocument;
  }

  @Component({
    selector: "app-date-chip-select",
    standalone: true,
    template: ``,
  })
  class TestDateChipComponent {
    @Input()
    set showOthers(showOthers: boolean) {}
    get showOthers() {return true;}
    @Input() options: [key: string, value: string][] = [];
    @Input() defaultOption: string | undefined;
  
    @Output() pickrOpened = new EventEmitter<void>();
    @Output() pickrClosed = new EventEmitter<Event>();
  }

  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let dataMock: jasmine.SpyObj<DataService>;
  let userMock: jasmine.SpyObj<UsersService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let user = signal(undefined);

  beforeEach(async () => {
    const AuthMock = jasmine.createSpyObj('AuthService', ['shareLists', 'unshareLists'], {me: user});
    const DataMock = jasmine.createSpyObj('DataService', [], {db: {
      items: {
        insert: () => Promise.resolve(),
        find: () => {return {$$: signal([new MockMyItemDocument()])}}
      },
      lists: {
        findOne: () => {return {$$: signal(undefined)}}
      },
      groceryCategories: {}}});
    const UserMock = jasmine.createSpyObj('AuthService', ['shareLists', 'unshareLists']);
    const SnackBarMock = jasmine.createSpyObj('SnackBar', ['open']);

    TestBed.overrideComponent(ListComponent, {
      add: {
        imports: [TestHeaderComponent, TestItemComponent, TestDateChipComponent]
      },
      remove: {
        imports: [ListHeaderComponent, ListItemComponent, DateChipSelectComponent]
      }
    })
    
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthMock },
        { provide: DataService, useValue: DataMock },
        { provide: UsersService, useValue: UserMock },
        { provide: MatSnackBar, useValue: SnackBarMock },
        provideAnimations(),
        provideRouter([{path: 'user/lists', component: TestComponent}]),
        provideHttpClientTesting(),
      ]
    });

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dataMock = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    userMock = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.id = 'asdf';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
