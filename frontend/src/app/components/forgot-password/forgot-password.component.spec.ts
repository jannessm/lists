import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ResetPasswordComponent', () => {
  @Component({
    selector: "app-login",
    standalone: true,
    template: ``,
  })
  class TestLoginComponent {}


  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const AuthMock = jasmine.createSpyObj('AuthService', ['forgotPwd']);
    const SnackBarMock = jasmine.createSpyObj('SnackBar', ['open']);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthMock },
        { provide: MatSnackBar, useValue: SnackBarMock },
        provideAnimations(),
        provideRouter([{path: 'login', component: TestLoginComponent}]),
        provideHttpClientTesting(),
      ]
    });

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
