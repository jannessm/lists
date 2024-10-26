import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth/auth.service';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('RegisterComponent', () => {
  @Component({
    selector: "app-test",
    standalone: true,
    template: ``,
  })
  class TestComponent {}

  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const AuthMock = jasmine.createSpyObj('AuthService', ['register']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthMock },
        provideAnimations(),
        provideRouter([{path: 'login', component: TestComponent}]),
        provideHttpClientTesting(),
      ]
    });

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
