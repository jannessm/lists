import { AfterViewInit, Component, Signal, effect } from '@angular/core';
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
import { DATA_TYPE } from '../../mydb/types/graphql-types';

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
export class ListsOverviewComponent implements AfterViewInit {

  me: Signal<MyMeDocument | undefined>;
  lists: MyListsDocument[] = [];
  listsSub?: Subscription;

  constructor(
    public bottomSheet: MatBottomSheet,
    private dataService: DataService,
    private authService: AuthService,
  ) {
    this.me = this.authService.me;

    effect(() => {
      const me = this.me();
      if (!!me) {
        if (this.listsSub) {
          this.listsSub.unsubscribe();
        }
        
        this.listsSub = this.dataService.db.lists.find({
          selector: {id: me.lists},
          sort: [{name: 'asc'}]
        }).$.subscribe(docs => {
          if (docs) {
            const shoppingLists = docs.filter((d: any) => d.isShoppingList) as any[];
            const nonShoppingLists = docs.filter((d: any) => !d.isShoppingList);
            this.lists = [...shoppingLists, ...nonShoppingLists] as MyListsDocument[];
          }
        });
      }
    });
  }
  
  ngAfterViewInit(): void {
    this.dataService.resync(DATA_TYPE.LISTS);
  }

  addList() {
    const dialogRef = this.bottomSheet.open(AddSheetComponent);

    dialogRef.afterDismissed().subscribe(async (res) => {
      const me = this.me();
      if (!!res && !!me) {
        const newList = newLists({
          name: res.name,
          isShoppingList: res.isShoppingList,
          createdBy: me.id,
        });

        const lists = me.lists || [];
        
        this.dataService.db.lists.insert(newList);
        me.patch({lists: [...lists, newList.id]})
      }
    });
  }

}
