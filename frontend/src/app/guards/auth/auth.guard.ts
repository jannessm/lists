import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { SESSION_COOKIE } from '../../globals';

export const authGuard: CanActivateFn = (route, state) => {
  const cookies = inject(CookieService);
  const router = inject(Router);

  const cookie = cookies.get(SESSION_COOKIE);

  if (!!cookie) {
    return true;
  } else {
    return router.parseUrl('/login');
  }
};
