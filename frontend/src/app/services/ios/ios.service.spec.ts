import { TestBed } from '@angular/core/testing';

import { IosService } from './ios.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarMock } from '../../../testing/mocks';

describe('IosService', () => {
  let service: IosService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: MatSnackBar, useValue: MatSnackBarMock}
      ]
    });

    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    service = TestBed.inject(IosService);
    expect(service).toBeTruthy();
  });
});
