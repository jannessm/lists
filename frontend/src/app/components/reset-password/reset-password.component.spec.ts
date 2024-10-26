import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswordComponent } from './reset-password.component';
import { ActivatedRoute, provideRouter, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { of } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { AuthServiceSpy } from '../../services/auth/auth.service.mock';

describe('ResetPasswordComponent', () => {

  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const ActivatedRouteMock = jasmine.createSpyObj('ActivatedRoute', [], {queryParams: of({token: 'token', email: 'nice_email'})});

    await TestBed.configureTestingModule({
      imports: [
        RouterLink
      ],
      providers: [
        { provide: ActivatedRoute, useValue: ActivatedRouteMock },
        { provide: AuthService, useClass: AuthServiceSpy },
        provideAnimations(),
        provideRouter([]),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    activatedRouteMock = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
