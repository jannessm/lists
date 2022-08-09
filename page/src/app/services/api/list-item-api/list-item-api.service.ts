import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, DataResponse } from 'src/app/models/api-responses';
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

  getItemsForList(list_id: string): Observable<DataResponse> {
    return this.http.get<DataResponse>(this.BASE_API + '?get-items-for-list&list_id=' + list_id);
  }

  updateDone(uuids: string[], done: boolean): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?update-done', {
      uuids,
      done
    });
  }

  updateItem(item: ListItem): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?update-item', item);
  }

  deleteItems(uuids: string[]): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(this.BASE_API + '?delete-item&uuids=' + uuids.join(','));
  }
}
