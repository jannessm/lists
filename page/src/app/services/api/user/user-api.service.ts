import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/models/api-responses';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  BASE_API = environment.api;

  constructor(private http: HttpClient) {}

  authorize(email: string, pwd: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + "auth/?login", {
      email,
      pwd
    });
  }

  validateJWT(jwt: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + "auth/?validate", {
      jwt
    });
  }
}
