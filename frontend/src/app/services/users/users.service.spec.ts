import { TestBed } from '@angular/core/testing';

import { UsersService } from './users.service';
import { DataService } from '../data/data.service';
import { MyCollection } from '../../mydb/collection';
import { MyUsersCollection } from '../../mydb/types/users';
import { MyMeCollection } from '../../mydb/types/me';

describe('UsersService', () => {
  let service: UsersService;
  let dataServiceMock: jasmine.SpyObj<DataService>;
  let usersTable: jasmine.SpyObj<MyUsersCollection>;
  let meTable: jasmine.SpyObj<MyMeCollection>;

  beforeEach(() => {
    usersTable = jasmine.createSpyObj('users', ['find']);
    meTable = jasmine.createSpyObj('me', ['findOne']);
    const DataServiceMock = jasmine.createSpyObj('DataService', [], {db: {users: usersTable, me: meTable}});

    TestBed.configureTestingModule({
      providers: [{provide: DataService, useValue: DataServiceMock}]
    });

    dataServiceMock = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
