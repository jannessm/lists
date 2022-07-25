import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReplaySubject, Subject } from 'rxjs';
import { API_STATUS } from 'src/app/models/api-responses';
import { List } from 'src/app/models/lists';
import { ListApiService } from '../api/list/list-api.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ListService {

  lists: Subject<List[]>;
  _lastDataObject: List[] = [];

  constructor(
    private listApi: ListApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.lists = new ReplaySubject<List[]>(1);

    this.updateData();
  }

  addList(list: List) {
    if (this.authService.loggedUser) {
      this.listApi.addList(this.authService.loggedUser.email, list).subscribe(resp => {
        console.log(resp);
        if (resp && resp.status === API_STATUS.SUCCESS) {
          this._lastDataObject.unshift(list);
          this.lists.next(this._lastDataObject);
        }
      });
    }
  }

  updateData() {
    if (this.authService.loggedUser) {
      this.listApi.getLists(this.authService.loggedUser.list_ids).subscribe(resp => {
        if (resp.status === API_STATUS.SUCCESS) {
          this._lastDataObject = <List[]>resp.payload
          this.lists.next(this._lastDataObject);
        } else {
          this.snackBar.open("Liste konnte nicht hinzugefügt werden", "Ok");
        }
      });
    }
  }
}
