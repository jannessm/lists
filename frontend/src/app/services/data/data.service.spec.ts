import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { ReplicationService } from '../replication/replication.service';
import { PusherService } from '../pusher/pusher.service';
import { of } from 'rxjs';
import { getDBMock } from './db.mock';
import { MyListsDatabase } from '../../mydb/types/database';

describe('DataService', () => {
  let service: DataService;
  let mockReplicationService: jasmine.SpyObj<ReplicationService>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let mockPusherService: jasmine.SpyObj<PusherService>;
  let mockDB: jasmine.SpyObj<MyListsDatabase>;

  beforeEach(() => {
    const MockHttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    const MockReplicationService = jasmine.createSpyObj('ReplicationService', ['setupReplication']);
    const MockPusherService = jasmine.createSpyObj('PusherService', [], {socketID: '1234'});
    mockDB = getDBMock();

    TestBed.configureTestingModule({
      providers: [
        {provide: ReplicationService, useValue: MockReplicationService},
        {provide: HttpClient, useValue: MockHttpClient},
        {provide: PusherService, useValue: MockPusherService},
      ]
    });

    mockReplicationService = TestBed.inject(ReplicationService) as jasmine.SpyObj<ReplicationService>;
    mockHttpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    mockPusherService = TestBed.inject(PusherService) as jasmine.SpyObj<PusherService>;

  });

  it('should be created', () => {
    const groceryCategories = {'a': ['b', 'c'], 'd': ['e']};
    mockHttpClient.get.and.returnValue(of(groceryCategories));
    service = TestBed.inject(DataService);

    spyOnProperty(service, 'db').and.returnValue(mockDB);

    expect(service).toBeTruthy();
    expect(service.groceryCategories).toEqual(groceryCategories);
  });
});
