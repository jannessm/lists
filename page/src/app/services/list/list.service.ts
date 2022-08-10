import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, of, ReplaySubject } from 'rxjs';
import { API_STATUS } from 'src/app/models/api-responses';
import { GroceryCategories } from 'src/app/models/categories_groceries';
import { List } from 'src/app/models/lists';
import { ListApiService } from '../api/list/list-api.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ListService {

  lists: ReplaySubject<List[]>;
  _lastDataObject: List[] = [];
  dataLoaded = false;
  groceryCategories: GroceryCategories = {};

  constructor(
    private listApi: ListApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.lists = new ReplaySubject<List[]>(1);

    this.authService.loggedStateChanges.subscribe(() => {
      this._lastDataObject = [];
      this.lists.next([]);
      this.dataLoaded = false;
    });


    this.listApi.getGroceryCategories().subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        this.groceryCategories = resp.payload;
      }
    });
  }

  addList(list: List) {
    list.name = list.name.trim();
    
    if (this.authService.loggedUser && list.name !== '') {
      this.listApi.addList(this.authService.loggedUser.email, list).subscribe(resp => {
        this.dataLoaded = true;
        if (resp && resp.status === API_STATUS.SUCCESS) {
          this._lastDataObject.unshift(list);
          this.lists.next(this._lastDataObject);
        }
      });
    } else if (list.name === '') {
      this.snackBar.open('Der Name darf nicht leer sein.', 'Ok');
    }
  }

  getList(uuid: string | null): List | undefined {
    return this._lastDataObject.find(l => l.uuid === uuid);
  }

  updateList(list: List) {
    list.name = list.name.trim();

    if (list.name === '') {
      this.snackBar.open('Der Name darf nicht leer sein.', 'Ok');
      return;
    }

    this.listApi.updateList(list).subscribe(resp => {
      if (resp && resp.status === API_STATUS.SUCCESS) {
        const old_list = this._lastDataObject.find(l => l.uuid === list.uuid);

        if (old_list) {
          old_list.name = list.name;
          old_list.groceries = list.groceries;
          this.lists.next(this._lastDataObject);
        } else {
          this.snackBar.open('Liste nicht gefunden', 'Ok');
        }
      } else {
        this.snackBar.open('Liste konnte nicht geändert werden.', 'Ok');
      }
    });
  }

  shareList(email: string, uuid: string) {
    this.listApi.shareList(email, uuid).subscribe(resp => {
      if (resp && resp.status !== API_STATUS.SUCCESS) {
        this.snackBar.open("Benutzer nicht gefunden.", "Ok");
      }
    })
  }

  deleteList(uuid: string) {
    if (this.authService.loggedUser) {
      return this.listApi.deleteList(this.authService.loggedUser.email, uuid).pipe(map(resp => {
        if (resp && resp.status === API_STATUS.SUCCESS) {
          const list_id = this._lastDataObject.findIndex(l => l.uuid === uuid);

          if (list_id > -1) {
            this._lastDataObject.splice(list_id, 1);
          }
          this.lists.next(this._lastDataObject);
          return true;
        } else {
          this.snackBar.open('Liste konnte nicht gelöscht werden.', 'Ok');
          return false;
        }
      }));
    } else {
      return of(false);
    }
  }

  updateData(): Observable<void> {
    if (this.authService.loggedUser) {
      return this.listApi.getLists(this.authService.loggedUser.email).pipe(map(resp => {
        if (resp.status === API_STATUS.SUCCESS) {
          this._lastDataObject = <List[]>resp.payload;
          this.lists.next(this._lastDataObject);
          this.dataLoaded = true;
        } else {
          this.snackBar.open("Liste konnte nicht hinzugefügt werden", "Ok");
        }
      }));
    } else {
      return of();
    }
  }
}
