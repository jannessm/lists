import { Injectable, OnDestroy } from '@angular/core';


import { NgcCookieConsentService } from 'ngx-cookieconsent';
import { Subscription } from 'rxjs';

import { JWT, COOKIE } from 'src/app/models/jwt';
import { COOKIE_CONFIG } from 'src/app/models/cookie-consent-config';

import ls from 'localstorage-slim';
import jwtDecode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService implements OnDestroy {

  private statusChangeSubscription: Subscription;
  private config = COOKIE_CONFIG;

  constructor(private ccService: NgcCookieConsentService) {
 
    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      () => {
        ls.set(COOKIE.CONSENT_POPUP, COOKIE.ACCEPTED);
      });

    this.config.enabled = ls.get(COOKIE.CONSENT_POPUP) !== COOKIE.ACCEPTED;

    this.ccService.init(this.config);
  }

  get jwt(): string | undefined {
    let jwt: string | null | undefined = ls.get(COOKIE.JWT);
    
    if (!!!jwt) {
      return;
    }
    
    const decoded: JWT = jwtDecode(jwt);
    
    return jwt;
  }

  set jwt(jwt: string | undefined) {
    if (!jwt) {
      ls.remove(COOKIE.JWT);
    } else {
      ls.set(COOKIE.JWT, jwt);
    }
  }

  ngOnDestroy() {
    this.statusChangeSubscription.unsubscribe();
  }
}
