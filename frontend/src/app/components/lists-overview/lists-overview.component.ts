import { Component, NgZone, Signal, WritableSignal, effect, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';

import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { MyListsDocument, newLists } from '../../mydb/types/lists';
import { DataService } from '../../services/data/data.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { MyMeDocument } from '../../mydb/types/me';
import { Subscription } from 'rxjs';

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

  me: Signal<MyMeDocument>;
  lists: MyListsDocument[] = [];
  listsSub?: Subscription;

  constructor(
    public bottomSheet: MatBottomSheet,
    private dataService: DataService,
    private authService: AuthService,
  ) {
    this.me = this.authService.me;

    effect(() => {
      if (this.me()) {
        this.listsSub = this.dataService.db.lists.find({
          selector: {id: this.me().lists},
          sort: [{name: 'asc'}]
        }).$.subscribe(docs => {
          const shoppingLists = docs.filter((d: any) => d.isShoppingList) as any[];
          const nonShoppingLists = docs.filter((d: any) => !d.isShoppingList);
          this.lists = [...shoppingLists, ...nonShoppingLists] as MyListsDocument[];
        });
      }
    });
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
          createdBy: {
            id: this.authService.me().id,
            name: this.authService.me().name
          },
        }));
      }
    });
  }

}
