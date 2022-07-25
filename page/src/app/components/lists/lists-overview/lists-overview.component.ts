import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { List } from 'src/app/models/lists';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ListService } from 'src/app/services/list/list.service';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';

import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-lists-overview',
  templateUrl: './lists-overview.component.html',
  styleUrls: ['./lists-overview.component.scss']
})
export class ListsOverviewComponent {

  lists: Observable<List[]>;

  constructor(
    public dialog: MatDialog,
    private listService: ListService
  ) {
    this.lists = this.listService.lists;
  }

  addList() {
    const dialogRef = this.dialog.open(AddDialogComponent);

    dialogRef.afterClosed().subscribe(res => {
      if (!!res) {
        this.listService.addList({
          uuid: uuid(),
          name: res.name,
          groceries: res.groceries
        });
      }
    });
  }

}
