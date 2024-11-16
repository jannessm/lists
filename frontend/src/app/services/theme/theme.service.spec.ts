import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { AuthService } from '../auth/auth.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const AuthServiceMock = jasmine.createSpyObj('AuthService', ['me'])

    TestBed.configureTestingModule({
      providers: [{provide: AuthService, useValue: AuthServiceMock}]
    });

    authServiceMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
