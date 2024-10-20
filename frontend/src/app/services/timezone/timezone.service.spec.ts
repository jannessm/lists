import { TestBed } from '@angular/core/testing';

import { TimezoneService } from './timezone.service';
import { DataService } from '../data/data.service';

describe('TimezoneService', () => {
  let service: TimezoneService;
  let dataServiceMock: jasmine.SpyObj<DataService>;

  beforeEach(() => {
    const DataServiceMock = jasmine.createSpyObj('DataService', [], {db: {items: {find: () => {return {bulkPatch: () => {}}}}}});
  
    TestBed.configureTestingModule({
      providers: [{provide: DataService, useValue: DataServiceMock}]
    });

    dataServiceMock = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    service = TestBed.inject(TimezoneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
