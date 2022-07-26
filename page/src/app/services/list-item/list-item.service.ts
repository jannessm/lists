import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ListItem, TIMESLOT_KEYS } from 'src/app/models/lists';
import { ListItemApiService } from '../api/list-item-api/list-item-api.service';

import { v4 as uuid } from 'uuid';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ListItemService {
  items = new Map<string, ReplaySubject<ListItem>>();

  constructor(
    private listItemApi: ListItemApiService,
    private authService: AuthService
  ) { }

  addItem(item: string, list_id: string, time: Date | TIMESLOT_KEYS.SOMETIME = TIMESLOT_KEYS.SOMETIME) {
    if (this.authService.loggedUser) {
      this.listItemApi.addItem({
        uuid: uuid(),
        name: item,
        done: false,
        created_by: this.authService.loggedUser.email,
        time,
        list_id
      }).subscribe(resp => {

      });
    }
  }

  loadItemsForList(uuid: string) {

  }
}
