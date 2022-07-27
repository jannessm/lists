import { Injectable } from '@angular/core';
import { map, Observable, of, ReplaySubject } from 'rxjs';
import { ListItem, Time } from 'src/app/models/lists';
import { ListItemApiService } from '../api/list-item-api/list-item-api.service';

import { v4 as uuid } from 'uuid';
import { AuthService } from '../auth/auth.service';
import { API_STATUS } from 'src/app/models/api-responses';

@Injectable({
  providedIn: 'root'
})
export class ListItemService {
  items = new Map<string, ReplaySubject<ListItem[]>>();
  _items = new Map<string, ListItem[]>();

  constructor(
    private listItemApi: ListItemApiService,
    private authService: AuthService
  ) { }

  addItem(item: string, list_id: string, time: Time = null): Observable<boolean> {
    if (this.authService.loggedUser) {
      return this.listItemApi.addItem({
        uuid: uuid(),
        name: item,
        done: false,
        created_by: this.authService.loggedUser.email,
        time,
        list_id
      }).pipe(map(resp => {
        return resp && resp.status === API_STATUS.SUCCESS;
      }));
    } else {
      return of(false);
    }
  }

  loadItemsForList(uuid: string) {
    if (!this.items.get(uuid)) {
      this.items.set(uuid, new ReplaySubject<ListItem[]>(1));
    }
    
    this.listItemApi.getItemsForList(uuid).subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const items = (<ListItem[]>resp.payload).map(item => {
          item.time = !item.time ? null : new Date(item.time);
          return item;
        });
        this._items.set(uuid, items);
        this.items.get(uuid)?.next(items);
      }
    })
  }
}
