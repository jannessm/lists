import { EventEmitter, Injectable } from '@angular/core';
import { Observable, ObservedValueOf, of, Subscriber } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserApiService } from '../api/user/user-api.service';
import { User } from 'src/app/models/user';
import { API_STATUS, DataResponse } from 'src/app/models/api-responses';
import { LocalStorageService } from '../local-storage/local-storage.service';

import jwt_decode from 'jwt-decode';
import { JWT } from 'src/app/models/jwt';
import { ThemeService } from '../theme/theme.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  _jwtValidation: Observable<boolean>;
  _isLoggedIn: boolean | undefined;

  // store the URL so we can redirect after logging in
  redirectUrl: string | null = null;

  loggedUser: User | null = null;

  loggedStateChanges = new EventEmitter<undefined>();

  constructor(
    private api: UserApiService,
    private lsService: LocalStorageService,
    private themeService: ThemeService
  ) {

    if (!!this.lsService.jwt) {
      const jwt = this.lsService.jwt;
      this._jwtValidation = this.api.validateJWT(jwt).pipe(
        map(resp => {
          if (resp.status === API_STATUS.SUCCESS && !!jwt) {
            this.setJWT((<DataResponse>resp).payload);
            return true;
          } else {
            return false;
          }
        }));
    } else {
      this._jwtValidation = of(false);
    }

    this._jwtValidation.subscribe();
  }

  isLoggedIn(): Observable<boolean> {
    // no JWT set
    if (!this.lsService.jwt) {
      return of(false);
    }

    // logged in is set
    if (this._isLoggedIn != undefined) {
      return of(this._isLoggedIn);
    }

    // get result from jwt validation
    return this._jwtValidation;
  }

  login(email: string, pwd: string): Observable<User | undefined> {
    return this.api.authorize(email, pwd).pipe(
      map(resp => {
        let data;
        
        if (resp.status === API_STATUS.SUCCESS) {
          let r = <DataResponse>resp;
                
          this.lsService.jwt = r.payload;
          this.loggedStateChanges.next(undefined);
          return this.setJWT(r.payload);
        
        }
        
        return data;
      })
    );
  }

  register(email: string, pwd: string): Observable<User | undefined> {
    return this.api.register(email, pwd).pipe(
      map(resp => {
        let data;
        
        if (resp.status === API_STATUS.SUCCESS) {
          let r = <DataResponse>resp;
                
          this.lsService.jwt = r.payload;
          this.loggedStateChanges.next(undefined);
          return this.setJWT(r.payload);
        }
        
        return data;
      })
    );
  }

  updateTheme(darkTheme: boolean | null): Observable<boolean | null> {
    if (this.loggedUser) {
      return this.api.setDarkTheme(this.loggedUser.email, darkTheme).pipe(map(resp => {
        if (resp.status === API_STATUS.SUCCESS && this.loggedUser) {
          this.loggedUser.dark_theme = darkTheme;
          this.themeService.userPreference = darkTheme;
          this.themeService.updateTheme();
          return darkTheme;
        
        } else if (this.loggedUser) {
          return this.loggedUser.dark_theme;
        
        } else {
          return null;
        }
      }))
    }
    return of(null);
  }

  logout(): void {
    this.loggedUser = null;
    this._isLoggedIn = false;
    this.lsService.jwt = undefined;
    this.loggedStateChanges.next(undefined);
  }

  setJWT(jwt: string): User {
    const jwt_decoded: JWT = jwt_decode(jwt);
    
    this.loggedUser = <User>jwt_decoded.user;

    this._isLoggedIn = true;

    this.themeService.userPreference = this.loggedUser.dark_theme;
    this.themeService.updateTheme();
    
    return jwt_decoded.user;
  }
}
