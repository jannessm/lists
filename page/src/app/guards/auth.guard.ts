import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const url: string = state.url;
    
    return this.authService.isLoggedIn().pipe(
      map(loggedIn => {
        // is logged in => continue routing
        if (loggedIn) {
          return true;

        // is not logged in => go to login page
        } else {
          this.authService.redirectUrl = url;
          throw Error();
        }
      }), catchError((err) => {
        return of(this.router.parseUrl('/login'));
      })
    );
  }
  
}
