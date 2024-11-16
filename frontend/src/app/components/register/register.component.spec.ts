import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth/auth.service';
import { Component } from '@angular/core';
import { provideRouter, RouterLink } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthServiceSpy } from '../../services/auth/auth.service.mock';

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

    await TestBed.configureTestingModule({
      imports: [
        RouterLink
      ],
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy },
        provideAnimations(),
        provideRouter([]),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
