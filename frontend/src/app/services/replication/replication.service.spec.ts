import { TestBed } from '@angular/core/testing';

import { ReplicationService } from './replication.service';
import { DataApiService } from '../data-api/data-api.service';
import { of } from 'rxjs';
import { PusherService } from '../pusher/pusher.service';

describe('ReplicationService', () => {
  let service: ReplicationService;
  let dataApiMock: jasmine.SpyObj<DataApiService>;
  let pusherMock: jasmine.SpyObj<PusherService>;

  beforeEach(() => {
    const DataApiMock = jasmine.createSpyObj('DataApiService', ['graphQL']);
    const PusherMock = jasmine.createSpyObj('PusherMock', [], {'online': {subscribe: () => of(true)}});

    TestBed.configureTestingModule({
      providers: [
        { provide: DataApiService, useValue: DataApiMock },
        { provide: PusherService, useValue: PusherMock },
    ]
    });

    dataApiMock = TestBed.inject(DataApiService) as jasmine.SpyObj<DataApiService>;
    pusherMock = TestBed.inject(PusherService) as jasmine.SpyObj<PusherService>;

    service = TestBed.inject(ReplicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
