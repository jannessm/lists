import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OthersFormComponent } from './others-form.component';
import { signal, Signal } from '@angular/core';
import { MyMeDocument } from '../../../mydb/types/me';
import { AuthService } from '../../../services/auth/auth.service';
import { AuthServiceSpy, MockMyMeDocument } from '../../../services/auth/auth.service.mock';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarMock } from '../../../../testing/mocks';

describe('OthersFormComponent', () => {
  let component: OthersFormComponent;
  let fixture: ComponentFixture<OthersFormComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
        { provide: MatSnackBar, useValue: MatSnackBarMock },
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    fixture = TestBed.createComponent(OthersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
