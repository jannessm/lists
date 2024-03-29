import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, DataResponse } from 'src/app/models/api-responses';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  BASE_API = environment.api;

  constructor(private http: HttpClient) {}

  authorize(email: string, pwd: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + "?login", {
      email,
      pwd
    });
  }

  validateJWT(jwt: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + "?validate", {
      jwt
    });
  }

  register(email: string, pwd: string): Observable<DataResponse> {
    return this.http.post<DataResponse>(this.BASE_API + "?register", {
      email,
      pwd
    });
  }

  setDarkTheme(email: string, darkTheme: boolean | null): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?update-theme', {
      email,
      'dark_theme': darkTheme
    });
  }

  addPushSubscriber(email: string, subscription: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?add-subscription', {
      email, subscription
    });
  }

  removePushSubscriber(email: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(this.BASE_API + '?remove-subscription&email='+email);
  }
}
