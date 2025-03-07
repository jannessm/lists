import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { CookieService } from 'ngx-cookie-service';
import { AuthApiService } from '../auth-api/auth-api.service';
import { Router } from '@angular/router';
import { PusherService } from '../pusher/pusher.service';
import { DataService } from '../data/data.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MockMyMeDocument } from './auth.service.mock';
import { getAuthApiMock } from '../auth-api/auth-api.mock';
import { CookieServiceMock, MatBottomSheetMock, MatSnackBarMock } from '../../../testing/mocks';

describe('AuthService', () => {
  let service: AuthService;
  let mockCookieService: jasmine.SpyObj<CookieService>;
  let mockAuthApi: jasmine.SpyObj<AuthApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPusherService: jasmine.SpyObj<PusherService>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockBottomSheet: jasmine.SpyObj<MatBottomSheet>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const MockAuthApi = getAuthApiMock();
    const MockRouter = jasmine.createSpyObj('Router', ['navigateByUrl'], {'url': '/user/lists'});
    const MockPusherService = jasmine.createSpyObj('PusherService', ['unsubscribe'], {'online': of(true)});
    const MockDataService = jasmine.createSpyObj('DataService', ['initDB', 'removeData'], {db: {me: {findOne: () => {return {$: of(MockMyMeDocument)}}}}});
    

    TestBed.configureTestingModule({
      providers: [
        {provide: CookieService, useValue: CookieServiceMock},
        {provide: AuthApiService, useValue: MockAuthApi},
        {provide: Router, useValue: MockRouter},
        {provide: PusherService, useValue: MockPusherService},
        {provide: DataService, useValue: MockDataService},
        {provide: MatBottomSheet, useValue: MatBottomSheetMock},
        {provide: MatSnackBar, useValue: MatSnackBarMock},
      ]
    });
    
    mockCookieService = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    mockAuthApi = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockPusherService = TestBed.inject(PusherService) as jasmine.SpyObj<PusherService>;
    mockDataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    mockBottomSheet = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    mockAuthApi.validateLogin.and.returnValue(of('error'));
    mockCookieService.check.and.returnValue(false);
    
    service = TestBed.inject(AuthService);

    expect(service).toBeTruthy();
  });
});
