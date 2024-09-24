import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { ReplicationService } from '../replication/replication.service';
import { PusherService } from '../pusher/pusher.service';

describe('DataService', () => {
  let service: DataService;
  let mockReplicationService: jasmine.SpyObj<ReplicationService>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let mockPusherService: jasmine.SpyObj<PusherService>;

  beforeEach(() => {
    const MockHttpClient = jasmine.createSpyObj('HttpClient', ['get']);
    const MockReplicationService = jasmine.createSpyObj('ReplicationService', ['setupReplication']);
    const MockPusherService = jasmine.createSpyObj('PusherService', [], {socketID: '1234'});

    TestBed.configureTestingModule({
      providers: [
        {provide: ReplicationService, useValue: MockReplicationService},
        {provide: HttpClient, useValue: MockHttpClient},
        {provide: PusherService, useValue: MockPusherService},
      ]
    });

    service = TestBed.inject(DataService);
    mockReplicationService = TestBed.inject(ReplicationService) as jasmine.SpyObj<ReplicationService>;
    mockHttpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    mockPusherService = TestBed.inject(PusherService) as jasmine.SpyObj<PusherService>;

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
