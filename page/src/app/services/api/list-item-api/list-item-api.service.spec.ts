import { TestBed } from '@angular/core/testing';

import { ListItemApiService } from './list-item-api.service';

describe('ListItemApiService', () => {
  let service: ListItemApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListItemApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
