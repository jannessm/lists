import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OthersFormComponent } from './others-form.component';
import { signal, Signal } from '@angular/core';
import { MyMeDocument } from '../../../mydb/types/me';
import { AuthService } from '../../../services/auth/auth.service';
import { MockMyMeDocument } from '../../../services/auth/auth.service.mock';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('OthersFormComponent', () => {
  let component: OthersFormComponent;
  let fixture: ComponentFixture<OthersFormComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let meSignal: Signal<MyMeDocument | undefined>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    meSignal = signal(new MockMyMeDocument());
    const AuthServiceMock = jasmine.createSpyObj('AuthService', [], {'me': meSignal});
    const SnackBarMock = jasmine.createSpyObj('SnackBar', ['open']);

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceMock },
        { provide: MatSnackBar, useValue: SnackBarMock },
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
