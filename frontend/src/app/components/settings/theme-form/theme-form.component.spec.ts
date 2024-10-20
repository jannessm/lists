import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeFormComponent } from './theme-form.component';
import { signal, Signal } from '@angular/core';
import { MyMeDocument } from '../../../mydb/types/me';
import { AuthService } from '../../../services/auth/auth.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('ThemeFormComponent', () => {
  let component: ThemeFormComponent;
  let fixture: ComponentFixture<ThemeFormComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let themeMock: jasmine.SpyObj<ThemeService>;
  let meSignal: Signal<MyMeDocument | undefined>;

  beforeEach(async () => {
    meSignal = signal(undefined);
    const AuthServiceMock = jasmine.createSpyObj('AuthService', [], {'me': meSignal});
    const ThemeServiceMock = jasmine.createSpyObj('ThemeService', ['userPreference']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceMock },
        { provide: ThemeService, useValue: ThemeServiceMock },
        provideAnimations()
      ]});

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    themeMock = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    

    fixture = TestBed.createComponent(ThemeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
