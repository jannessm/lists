import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';

import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { Lists, newLists } from '../../../models/rxdb/lists';
import { DataService } from '../../services/data/data.service';
import { DATA_TYPE } from '../../../models/rxdb/graphql-types';
import { RxDocument } from 'rxdb';
import { RouterModule } from '@angular/router';
import { ulid } from 'ulid';

@Component({
  selector: 'app-lists-overview',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule
  ],
  templateUrl: './lists-overview.component.html',
  styleUrls: ['./lists-overview.component.scss']
})
export class ListsOverviewComponent {

  lists: RxDocument<Lists>[] | undefined;

  constructor(
    public bottomSheet: MatBottomSheet,
    private dataService: DataService,
  ) {
    this.dataService.dbInitialized.subscribe(initialized => {
      if (initialized && this.dataService.db && this.dataService.db[DATA_TYPE.LISTS]) {
        this.dataService.db[DATA_TYPE.LISTS].find({
          sort: [{name: 'asc'}]
        }).$.subscribe(lists => {
          this.lists = lists;
        })
      }
    });
  }

  addList() {
    const dialogRef = this.bottomSheet.open(AddSheetComponent);

    dialogRef.afterDismissed().subscribe(async (res) => {
      if (!!res &&
          this.dataService.db &&
          this.dataService.db[DATA_TYPE.LISTS] &&
          this.dataService.db[DATA_TYPE.ME]
      ) {
        const me = (await this.dataService.db[DATA_TYPE.ME].find().exec())[0];

        this.dataService.db[DATA_TYPE.LISTS].insert(newLists({
          name: res.name,
          isShoppingList: res.isShoppingList,
          createdBy: {id: me.id, name: me.name},
        }));
      }
    });
  }

}
