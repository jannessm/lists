import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, DataResponse } from 'src/app/models/api-responses';
import { List } from 'src/app/models/lists';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ListApiService {
  BASE_API = environment.api;

  constructor(private http: HttpClient) {}

  addList(email: string, list: List): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?add-list', {
      email,
      list
    });
  }

  getLists(list_ids: string[]): Observable<DataResponse> {
    return this.http.get<DataResponse>(this.BASE_API + '?get-lists&list_ids=' + list_ids.join(","));
  }
}
