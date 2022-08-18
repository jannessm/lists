import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, DataResponse } from 'src/app/models/api-responses';
import { List } from 'src/app/models/lists';
import { environment } from 'src/environments/environment';

import { v4 as genUuid } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ListApiService {
  BASE_API = environment.api;

  constructor(private http: HttpClient) {}

  addList(email: string, list: List): Observable<ApiResponse> {
    const req_id = genUuid();
  
    return this.http.post<ApiResponse>(this.BASE_API + '?add-list&uuid=' + req_id, {
      email,
      list
    });
  }

  getLists(email: string): Observable<DataResponse> {
    return this.http.get<DataResponse>(this.BASE_API + '?get-lists&email=' + encodeURIComponent(email));
  }

  updateList(list: List): Observable<ApiResponse> {
    const req_id = genUuid();
    return this.http.post<ApiResponse>(this.BASE_API + '?update-list&uuid=' + req_id, list);
  }

  shareList(email: string, uuid: string): Observable<ApiResponse> {
    const req_id = genUuid();
    return this.http.post<ApiResponse>(this.BASE_API + '?share-list&uuid=' + req_id, {email, uuid});
  }

  deleteList(email: string, uuid: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(this.BASE_API + '?delete-list&uuid=' + uuid + '&email=' + encodeURIComponent(email));
  }

  getGroceryCategories(): Observable<DataResponse> {
    return this.http.get<DataResponse>(this.BASE_API + '?grocery-categories');
  }
}
