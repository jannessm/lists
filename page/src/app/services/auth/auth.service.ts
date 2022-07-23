import { EventEmitter, Injectable } from '@angular/core';
import { Observable, of, Subscriber } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserApiService } from '../api/user/user-api.service';
import { User } from 'src/app/models/user';
import { API_STATUS, DataResponse } from 'src/app/models/api-responses';
import { LocalStorageService } from '../local-storage/local-storage.service';

import jwt_decode from 'jwt-decode';
import { JWT } from 'src/app/models/jwt';

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

    return jwt_decoded.user;
  }
}
