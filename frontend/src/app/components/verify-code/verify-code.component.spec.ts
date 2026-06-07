import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyCodeComponent } from './verify-code.component';
import { AuthService } from '../../services/auth/auth.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class AuthServiceStub {
  pendingEmail = signal<string | null>('test@example.com');
  verifyCode = jasmine.createSpy('verifyCode').and.returnValue(of({ success: true }));
  resendCode = jasmine.createSpy('resendCode').and.returnValue(of(true));
}

describe('VerifyCodeComponent', () => {
  let component: VerifyCodeComponent;
  let fixture: ComponentFixture<VerifyCodeComponent>;
  let authStub: AuthServiceStub;

  beforeEach(async () => {
    authStub = new AuthServiceStub();

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        provideRouter([]),
        provideAnimations(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show pending email', () => {
    expect(component.pendingEmail).toBe('test@example.com');
  });

  it('should call verifyCode on submit', () => {
    component.form.get('code')?.setValue('ABC123');
    component.submit();
    expect(authStub.verifyCode).toHaveBeenCalledWith('ABC123');
  });

  it('should set error message on invalid code', () => {
    authStub.verifyCode.and.returnValue(of({ error: 'invalid_code' }));
    component.form.get('code')?.setValue('XXXXXX');
    component.submit();
    expect(component.errorMessage()).toBeTruthy();
  });

  it('should call resendCode', () => {
    component.resend();
    expect(authStub.resendCode).toHaveBeenCalled();
  });
});
