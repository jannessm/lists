import { Injectable } from '@angular/core';
import { UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl: UrlTree | string | undefined;

  constructor() { }

  isLoggedIn(): Observable<boolean | UrlTree> {
    return of(false);
  }
}
