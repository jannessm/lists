import { Component } from '@angular/core';
import { Observable } from 'rxjs';
// import { ListService } from 'src/app/services/list/list.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';

import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { List } from '../../../models/lists';

@Component({
  selector: 'app-lists-overview',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule
  ],
  templateUrl: './lists-overview.component.html',
  styleUrls: ['./lists-overview.component.scss']
})
export class ListsOverviewComponent {

  lists: Observable<List[]> | undefined;

  constructor(
    public bottomSheet: MatBottomSheet,
    // private listService: ListService
  ) {
    // this.lists = this.listService.lists;
    // if (!this.listService.dataLoaded) {
    //   this.listService.updateData().subscribe();
    // }
  }

  addList() {
    const dialogRef = this.bottomSheet.open(AddSheetComponent);

    dialogRef.afterDismissed().subscribe(res => {
      if (!!res) {
        // this.listService.addList({
        //   uuid: uuid(),
        //   name: res.name,
        //   groceries: res.groceries,
        //   shared: false,
        //   users: []
        // });
      }
    });
  }

}
