import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthResponse, ValidateResponse, VerifyMailResponse } from '../../../models/responses';
import { BASE_API, REGISTER } from '../../globals';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  constructor(private http: HttpClient) {
    this.http.get(BASE_API.replace('api/', '') + "sanctum/csrf-cookie").subscribe(()=>{});
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<HttpResponse<AuthResponse>>(BASE_API + "login", {
      email,
      password,
      remember: true
    }, {observe: 'response'}).pipe(
      map(res => {

        // success
        if (res.status === 200) {
          return true;
        } else {
          // res.status === 422
          return false;
        }
      }),
      catchError(() => of(false))
    );
  }

  register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ): Observable<AuthResponse | REGISTER> {
    return this.http.post<AuthResponse>(BASE_API + "register", {
      name, email, password, password_confirmation
    }, { observe: 'response' }).pipe(
      map(res => {
        if (res.status === 201) {
          return REGISTER.SUCCESS;
        } else if (res.status === 304 ) {
          return REGISTER.FOUND;
        }
        return REGISTER.ERROR;
      }),
      catchError(res => {
        return of(res.error);
      })
    );
  }

  logout(): Observable<boolean> {
    return this.http.post<AuthResponse>(BASE_API + "logout", {}, { observe: 'response' }).pipe(
      map(res => {
        return res.status === 200;
      }),
      catchError(() => of(false))
    );
  }

  validateLogin(): Observable<boolean> {
    return this.http.get<ValidateResponse>(BASE_API + 'auth', {observe: 'response'}).pipe(
      map(res => {
        return res.status === 200 && !!res.body?.loggedIn;
      }),
      catchError(() => of(false))
    );
  }

  verifyEmail(): Observable<boolean> {
    return this.http.get<VerifyMailResponse>(BASE_API + 'email/verified', {observe: 'response'}).pipe(
      map(res => {
        return res.status === 200 && !!res.body?.verified;
      }),
      catchError(() => of(false))
    );
  }

  resendVerificationMail(): Observable<boolean> {
    return this.http.get(BASE_API + 'email/verification-notification', {observe: 'response'}).pipe(
      map( res => {
        return res.status === 200;
      }),
      catchError(() => of(false))
    );
  }
}
