import { Injectable } from '@angular/core';
import { map, Observable, ObservedValueOf, of, ReplaySubject } from 'rxjs';
import { ListItem, Time } from 'src/app/models/lists';
import { ListItemApiService } from '../api/list-item-api/list-item-api.service';

import { v4 as uuid } from 'uuid';
import { AuthService } from '../auth/auth.service';
import { API_STATUS } from 'src/app/models/api-responses';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ListItemService {
  items = new Map<string, ReplaySubject<ListItem[]>>();
  _items = new Map<string, ListItem[]>();

  constructor(
    private listItemApi: ListItemApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  addItem(item: string, list_id: string, time: Time = null): Observable<boolean> {
    if (this.authService.loggedUser) {
      const new_item = {
        uuid: uuid(),
        name: item,
        done: false,
        created_by: this.authService.loggedUser.email,
        time,
        list_id
      };

      return this.listItemApi.addItem(new_item).pipe(map(resp => {
        if (resp && resp.status === API_STATUS.SUCCESS) {
          const items = this._items.get(list_id);
          const itemsSubj = this.items.get(list_id);

          if (items && itemsSubj) {
            items.push(new_item);
            this._items.set(list_id, items);
            itemsSubj.next(items);
          }
        }
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

  updateDone(list_id: string, uuid: string, done: boolean): Observable<boolean> {
    return this.listItemApi.updateDone(uuid, done).pipe(map(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const items = this._items.get(list_id);
        
        if (items) {
          const item = items.find(i => i.uuid === uuid);
          
          if (item) {
            item.done = done;
          }

          this.items.get(list_id)?.next(items);
        }
        return true;
      } else {
        this.snackBar.open("Konnte Element nicht updaten", "Ok");
        return false;
      }
    }));
  }

  updateItem(list_id: string, item: ListItem) {
    this.listItemApi.updateItem(item).subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const items = this._items.get(list_id);
        const itemsSubj = this.items.get(list_id);

        if (items && itemsSubj) {
          const i = items.find(i => i.uuid === item.uuid);

          if (i) {
            i.name = item.name;
            i.time = item.time;

            itemsSubj.next(items);
          }
        }
      } else {
        this.snackBar.open("Konnte Änderungen nicht speichern", "Ok");
      }
    })
  }

  deleteItem(list_id: string, uuid: string) {
    this.listItemApi.deleteItem(uuid).subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const items = this._items.get(list_id);
        const itemsSubj = this.items.get(list_id);

        if (items && itemsSubj) {
          const id = items.findIndex(i => i.uuid === uuid);

          if (id > -1) {
            items.splice(id, 1);
            itemsSubj.next(items);
          }
        }
      } else {
        this.snackBar.open("Element konnte nicht gelöscht werden", "Ok");
      }
    });
  }
}
