import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { SESSION_COOKIE } from '../../globals';

export const isLoggedGuard: CanActivateFn = (route, state) => {
  const cookies = inject(CookieService);
  const router = inject(Router);

  if (!cookies.check(SESSION_COOKIE)) {
    return true;
  } else {
    return router.parseUrl('/user/lists');
  }
};
