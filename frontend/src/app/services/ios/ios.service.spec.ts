import { TestBed } from '@angular/core/testing';

import { IosService } from './ios.service';

describe('IosService', () => {
  let service: IosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
