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
    return this.http.post<ApiResponse>(this.BASE_API + '?add-item&uuid=' + item.uuid, item);
  }

  getItemsForList(list_id: string): Observable<DataResponse> {
    return this.http.get<DataResponse>(this.BASE_API + '?get-items-for-list&list_id=' + list_id);
  }

  updateDone(uuids: string[], done: boolean, list_id: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?update-done&uuids=' + uuids.join(',') + '&list_id=' + list_id, {
      uuids,
      done
    });
  }

  updateItem(item: ListItem): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.BASE_API + '?update-item&uuid=' + item.uuid, item);
  }

  deleteItems(uuids: string[], list_id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(this.BASE_API + '?delete-items&uuids=' + uuids.join(',') + '&list_id=' + list_id);
  }
}
