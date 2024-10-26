import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth/auth.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, RouterLink } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthServiceSpy } from '../../services/auth/auth.service.mock';

describe('LoginComponent', () => {

  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [
        RouterLink
      ],
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy },
        provideAnimations(),
        provideRouter([]),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    
    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
