import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class IsLoggedGuard  {
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const url: string = state.url;
    console.log(url, );

    if (this.router.getCurrentNavigation()?.extras.state?.['bypass']) {
      return true;
    }
  
    return this.checkLogin(url);
  }

  checkLogin(url: string): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn().pipe(
      map(loggedIn => !loggedIn || this.router.parseUrl('/user/lists'))
    );
  }
  
}
