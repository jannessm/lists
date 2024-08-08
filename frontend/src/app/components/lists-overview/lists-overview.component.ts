import { Component, Signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';

import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { RxListsDocument, newLists } from '../../mydb/types/lists';
import { DataService } from '../../services/data/data.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

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

  lists: Signal<RxListsDocument[]>;

  constructor(
    public bottomSheet: MatBottomSheet,
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.lists = this.dataService.db.lists.find({
      sort: [{name: 'asc'}]
    }).$$ as Signal<RxListsDocument[]>;
  }

  addList() {
    const dialogRef = this.bottomSheet.open(AddSheetComponent);

    dialogRef.afterDismissed().subscribe(async (res) => {
      if (!!res &&
          this.authService.me && 
          this.authService.me()
      ) {
        this.dataService.db.lists.insert(newLists({
          name: res.name,
          isShoppingList: res.isShoppingList,
          createdBy: {id: this.authService.me().id, name: this.authService.me().name},
        }));
      }
    });
  }

}
