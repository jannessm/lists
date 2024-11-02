import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthResponse, ChangeEmailResponse, ChangeEmailStatus, ValidateResponse, VerifyMailResponse } from '../../../models/responses';
import { BASE_API, REGISTER } from '../../globals';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  constructor(private http: HttpClient) {
    this.refreshCSRF();
  }

  refreshCSRF() {
    this.http.get(BASE_API.replace('api/', '') + "sanctum/csrf-cookie", {
      headers: {'ngsw-bypass': 'true'}
    }).subscribe(()=>{});
  }

  login(email: string, password: string, captcha: string): Observable<boolean> {
    return this.http.post<HttpResponse<AuthResponse>>(BASE_API + "login", {
      email,
      password,
      remember: true,
      captcha
    }, {observe: 'response'}).pipe(
      catchError(() => of(false)),
      map(res => {
        // success
        if (res instanceof HttpResponse && res.status === 200) {
          return true;
        } else {
          // res.status === 422
          return false;
        }
      }),
    );
  }

  register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    captcha: string
  ): Observable<AuthResponse | REGISTER> {
    return this.http.post<AuthResponse>(BASE_API + "register", {
      name, email, password, password_confirmation, captcha
    }, { observe: 'response' }).pipe(
      catchError(res => {
        return of(res);
      }),
      map(res => {
        if (res.status === 201 || res.status === 200) {
          return REGISTER.SUCCESS;
        } else if (res.status === 304 || res.status === 422 ) {
          return REGISTER.FOUND;
        }
        return REGISTER.ERROR;
      })
    );
  }

  logout(): Observable<boolean> {
    return this.http.post<AuthResponse>(BASE_API + "logout", {}, { observe: 'response' }).pipe(
      catchError(() => of(false)),
      map(this.okMapper),
    );
  }

  validateLogin(): Observable<string | null> {
    return this.http.get<ValidateResponse>(BASE_API + 'auth', {observe: 'response'}).pipe(
      catchError(() => of('error')),
      map(res => {
        if (res instanceof HttpResponse) {
          if (res.status === 200 && !!res.body) {
            return res.body.loggedIn;
          }
        }

        return 'error';
      }),
    );
  }

  verifyEmail(): Observable<boolean> {
    return this.http.get<VerifyMailResponse>(BASE_API + 'email/verified', {observe: 'response'}).pipe(
      catchError(() => of(false)),
      map(res => {
        if (res instanceof HttpResponse) {
          if (res.status === 200 && !!res.body?.verified) {
            return true;
          }
        }

        return false;
      }),
    );
  }

  resendVerificationMail(): Observable<boolean> {
    return this.http.post(BASE_API + 'email/verification-notification',  {}, {observe: 'response'}).pipe(
      catchError(() => of(false)),
      map(this.okMapper),
    );
  }

  changeEmail(newEmail: string): Observable<ChangeEmailStatus> {
    return this.http.post<ChangeEmailResponse>(BASE_API + 'user/change-email', {
      newEmail
    }).pipe(
      catchError(() => of(ChangeEmailStatus.ERROR)),
      map(res => {
        if (!(typeof res !== 'string')) {
          const r = res as any as ChangeEmailResponse;
          if (r.status === ChangeEmailStatus.EMAIL_ALREADY_USED) {
            return ChangeEmailStatus.EMAIL_ALREADY_USED;
          } else if (r.status === ChangeEmailStatus.OK) {
            return ChangeEmailStatus.OK;
          }
        }

        return ChangeEmailStatus.ERROR;
      }),
    );
  }

  changePwd(current_password: string, password: string, password_confirmation: string): Observable<boolean> {
    return this.http.put(BASE_API + 'user/password', {
      current_password,
      password,
      password_confirmation
    }, { observe: 'response' }).pipe(
      catchError(() => of(false)),
      map(this.okMapper),
    );
  }

  forgotPwd(email: string): Observable<boolean> {
    return this.http.post(BASE_API + 'forgot-password', {
      email
    }, {observe: 'response'}).pipe(
      catchError(err => {
        if (err.status === 422) {
          return of(true);
        }
        return of(false)
      }),
      map(this.okMapper)
    );
  }

  resetPwd(
    token: string,
    email: string,
    password: string,
    password_confirmation: string
  ): Observable<boolean> {
    return this.http.post(BASE_API + 'reset-password', {
      token, email, password, password_confirmation
    }, {observe: 'response'}).pipe(
      catchError(() => of(false)), // 422 error
      map(this.okMapper),
    );
  }

  shareLists(email: string, listsId: string): Observable<boolean> {
    return this.http.post(BASE_API + `email/share-lists-notification/${listsId}`, {
      email
    }, {observe: 'response'}).pipe(
      catchError(() => of(false)),
      map(this.okMapper)
    )
  }

  unshareLists(user: string, listsId: string): Observable<boolean> {
    return this.http.post(BASE_API + `unshare-lists/${listsId}`, {
      user
    }, {observe: 'response'}).pipe(
      catchError(() => of(false)),
      map(this.okMapper)
    )
  }

  pushSubscribe(endpoint: string, key: string, token: string): Observable<boolean> {
    return this.http.post(BASE_API + 'push/subscribe', {
      endpoint,
      key,
      token
    }, {observe: 'response'}).pipe(
      catchError(() => of(false)),
      map(this.okMapper)
    )
  }

  okMapper(res: HttpResponse<any> | boolean) {
    if (res instanceof HttpResponse) {
      return res.ok;
    }
    return res;
  }
}
