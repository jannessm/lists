import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/models/api-responses';
import { ListItem } from 'src/app/models/lists';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ListItemApiService {
  BASE_API = environment.api;

  constructor(private http: HttpClient) {}

  addItem(item: ListItem): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?add-item', item);
  }
}
