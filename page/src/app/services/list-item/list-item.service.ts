import { Injectable } from '@angular/core';
import { map, Observable, of, ReplaySubject } from 'rxjs';
import { ListItem } from 'src/app/models/lists';
import { ListItemApiService } from '../api/list-item-api/list-item-api.service';

import { v4 as uuid } from 'uuid';
import { AuthService } from '../auth/auth.service';
import { API_STATUS } from 'src/app/models/api-responses';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Time } from 'src/app/models/categories_timeslots';
import { UpdateService } from '../update/update.service';

@Injectable({
  providedIn: 'root'
})
export class ListItemService {
  items = new Map<string, ReplaySubject<ListItem[]>>();
  _items = new Map<string, ListItem[]>();

  constructor(
    private listItemApi: ListItemApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private updateService: UpdateService
  ) {
    this.authService.loggedStateChanges.subscribe(() => {
      this.items.clear();
      this._items.clear();
    });

    this.updateService.register('listItemService', this.updateAllLists.bind(this));
  }

  addItem(item: string, list_id: string, time: Time = null): Observable<boolean> {
    item = item.trim();
    if (item === '') {
      this.snackBar.open('Der Inhalt darf nicht leer sein.', 'Ok');
      return of(false);
    }
    
    if (this.authService.loggedUser) {
      const new_item: ListItem = {
        uuid: uuid(),
        name: item,
        done: false,
        created_by: this.authService.loggedUser.email,
        time,
        list_id,
        remind: false
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
        } else {
          this.snackBar.open('Eintrag konnte nicht hinzugefügt werden.', 'Ok');
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
          
          // check for invalid Date
          if (!!item.time && isNaN(item.time.getTime())) {
            item.time = null;
          }
          
          return item;
        });
        this._items.set(uuid, items);
        this.items.get(uuid)?.next(items);
      }
    })
  }

  updateDone(list_id: string, uuids: string[], done: boolean): Observable<boolean> {
    return this.listItemApi.updateDone(uuids, done, list_id).pipe(map(resp => {
      if ((resp && resp.status === API_STATUS.SUCCESS)) {
        const items = this._items.get(list_id);
        
        if (items) {
          uuids.forEach(uuid => {
            const item = items.find(i => i.uuid === uuid);
            
            if (item) {
              item.done = done;
            }
  
            this.items.get(list_id)?.next(items);
          });
        }
        return true;
      } else {
        this.snackBar.open("Konnte Eintrag nicht aktualisieren", "Ok");
        return false;
      }
    }));
  }

  updateItem(list_id: string, item: ListItem) {
    item.name = item.name.trim();
    
    if (item.name === '') {
      this.snackBar.open('Der Inhalt darf nicht leer sein.', 'Ok');
      return;
    }

    this.listItemApi.updateItem(item).subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const items = this._items.get(list_id);
        const itemsSubj = this.items.get(list_id);

        if (items && itemsSubj) {
          const i = items.find(i => i.uuid === item.uuid);

          if (i) {
            i.name = item.name;
            i.time = !item.time ? null: new Date(item.time);
            i.remind = item.remind;

            itemsSubj.next(items);
          }
        }
      } else {
        this.snackBar.open("Konnte Änderungen nicht speichern", "Ok");
      }
    })
  }

  deleteItems(list_id: string, uuids: string[]) {
    this.listItemApi.deleteItems(uuids, list_id).subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const items = this._items.get(list_id);
        const itemsSubj = this.items.get(list_id);

        if (items && itemsSubj) {
          uuids.forEach(uuid => {
            const id = items.findIndex(i => i.uuid === uuid);
  
            if (id > -1) {
              items.splice(id, 1);
              itemsSubj.next(items);
            }
          })
        }
      } else {
        this.snackBar.open("Element konnte nicht gelöscht werden", "Ok");
      }
    });
  }

  updateAllLists() {
    for (let k of this._items.keys()) {
      this.loadItemsForList(k);
    }
  }
}
