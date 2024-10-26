import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth/auth.service';
import { Component, EventEmitter, Input, Output, signal, Signal } from '@angular/core';
import { MyMeDocument } from '../../mydb/types/me';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HCaptchaComponent } from '../hcaptcha/hcaptcha.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  @Component({
    selector: "app-login",
    standalone: true,
    template: ``,
  })
  class TestLoginComponent {}


  @Component({
    selector: "app-hcaptcha",
    standalone: true,
    template: ``,
  })
  class TestCaptchaComponent {
    @Input() init!: Signal<boolean>;
    @Output() verify = new EventEmitter<string>();
    @Output() expired = new EventEmitter<any>();
    @Output() error = new EventEmitter<any>();
  }

  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const AuthServiceMock = jasmine.createSpyObj('AuthService', ['login']);

    TestBed.overrideComponent(LoginComponent, {
      add: {
        imports: [TestCaptchaComponent]
      },
      remove: {
        imports: [HCaptchaComponent]
      }
    })

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceMock },
        provideAnimations(),
        provideRouter([
          {path: 'forgot-password', component: TestLoginComponent},
          {path: 'register', component: TestLoginComponent}
        ]),
        provideHttpClientTesting(),
      ]
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
