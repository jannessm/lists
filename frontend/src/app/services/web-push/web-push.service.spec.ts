import { TestBed } from '@angular/core/testing';

import { WebPushService } from './web-push.service';
import { SwPush } from '@angular/service-worker';
import { AuthService } from '../auth/auth.service';
import { DataApiService } from '../data-api/data-api.service';

describe('WebPushService', () => {
  let service: WebPushService;
  let swPushMock: jasmine.SpyObj<SwPush>;
  let authMock: jasmine.SpyObj<AuthService>;
  let dataApiMock: jasmine.SpyObj<DataApiService>;

  beforeEach(() => {
    const SwPushMock = jasmine.createSpyObj('SwPush', [], {isEnabled: false});
    const AuthServiceMock = jasmine.createSpyObj('AuthService', ['me', 'pushSubscribe']);
    const DataApiMock = jasmine.createSpyObj('DataApiService', ['graphQL']);

    TestBed.configureTestingModule({
      providers: [
        { provide: SwPush, useValue: SwPushMock },
        { provide: AuthService, useValue: AuthServiceMock },
        { provide: DataApiService, useValue: DataApiMock },
      ]
    });

    swPushMock = TestBed.inject(SwPush) as jasmine.SpyObj<SwPush>;
    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dataApiMock = TestBed.inject(DataApiService) as jasmine.SpyObj<DataApiService>;

    service = TestBed.inject(WebPushService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
