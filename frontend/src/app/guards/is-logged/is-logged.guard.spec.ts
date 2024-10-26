import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { isLoggedGuard } from './is-logged.guard';

describe('isLoggedGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => isLoggedGuard(...guardParameters));

  beforeEach(() => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
