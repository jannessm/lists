import { TestBed } from '@angular/core/testing';

import { AuthApiService } from './auth-api.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { HttpClientMock } from '../../../testing/mocks';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        {provide: HttpClient, useValue: HttpClientMock}
      ]
    });

    mockHttpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should be created', () => {
    mockHttpClient.get.and.returnValue(of());
    
    service = TestBed.inject(AuthApiService);
    expect(service).toBeTruthy();
  });
});
