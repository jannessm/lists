import { TestBed } from '@angular/core/testing';

import { DataApiService } from './data-api.service';
import { HttpClient } from '@angular/common/http';
import { HttpClientMock } from '../../../testing/mocks';

describe('DataApiService', () => {
  let service: DataApiService;
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
    service = TestBed.inject(DataApiService);
    expect(service).toBeTruthy();
  });
});
