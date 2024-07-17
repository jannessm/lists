import { Component, HostListener, Input } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { RxDocument } from 'rxdb';
import { ListItem } from '../../../models/rxdb/list-item';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UpdateItemSheetComponent } from '../bottom-sheets/update-item-sheet/update-item-sheet.component';
import { Lists } from '../../../models/rxdb/lists';
import { ConfirmSheetComponent } from '../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { is_today } from '../../../models/categories_timeslots';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    NameBadgePipe,
    FormsModule
  ],
  templateUrl: './list-item.component.html',
  styleUrl: './list-item.component.scss'
})
export class ListItemComponent {
  @Input()
  userId: string | undefined;
  @Input()
  list: RxDocument<Lists> | undefined;
  @Input()
  item: RxDocument<ListItem> | undefined;

  pointerDown: boolean = false;
  pointerPosY: number | undefined; 
  updateSheetRef: MatBottomSheetRef<UpdateItemSheetComponent, any> | undefined;

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent): void  {
    this.pointerPosY = event.clientY;
  }
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    this.pointerPosY = event.changedTouches[0].clientY;
  }

  constructor(private bottomSheet: MatBottomSheet) {}

  toggleDone(item: RxDocument<ListItem> | undefined, done: boolean | null = null) {
    if (this.list && item) {
      // const new_done = done !== null ? done : item.done;
      // this.listItemService.updateDone(this.list.uuid, [item.uuid], new_done).subscribe(success => {
        //TODO: count unmarked items
      // });
    }
  }

  deleteItem(item: ListItem) {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche ' + item.name});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        
        // this.listItemService.deleteItems(this.list.uuid, [item.uuid]);
      }
    });
  }

  userFab(item: ListItem) {
    const index = this.list?.sharedWith.findIndex(val => val.id === item.createdBy.id);
    if (index) {
      return index;
    }
    return 0;
  }

  is_today(item: ListItem): boolean {
    return !!is_today(item);
  }

  openUpdateSheet(event: MouseEvent, item?: ListItem) {
    if (!this.pointerDown && item) {
      this.pointerDown = true;
      const currScrollPos = event.clientY;
      this.pointerPosY = currScrollPos;
      
      setTimeout(() => {
        
        if (this.pointerPosY != undefined && this.pointerDown && !this.updateSheetRef && Math.abs(currScrollPos - this.pointerPosY) < 50) {  
          this.updateSheetRef = this.bottomSheet.open(UpdateItemSheetComponent, {
            data: {
              list: this.list,
              item
            }
          });
  
          this.updateSheetRef.afterDismissed().subscribe(newItem => {            
            if (this.list && newItem) {
              try {
                newItem.time = (new Date(newItem.time)).toISOString();
              } catch {
                newItem.time = null;
              }

              newItem.uuid = item.id;

              // this.listItemService.updateItem(this.list.uuid, newItem);
            }

            setTimeout(() => {
              this.cancelUpdateSheet();
            }, 500);
          });
        } else {
          this.cancelUpdateSheet();
        }
      }, 500);
    }
  }

  cancelUpdateSheet() {
    this.pointerDown = false;
    this.updateSheetRef = undefined;
  }
}
