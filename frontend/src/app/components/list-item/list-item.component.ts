import { Component, HostListener, Input, Signal, WritableSignal, effect, signal } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { MyItemDocument } from '../../mydb/types/list-item';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UpdateItemSheetComponent } from '../bottom-sheets/update-item-sheet/update-item-sheet.component';
import { MyListsDocument } from '../../mydb/types/lists';
import { ConfirmSheetComponent } from '../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { is_today } from '../../../models/categories_timeslots';
import { FormsModule } from '@angular/forms';
import { MyMeDocument } from '../../mydb/types/me';
import { DataService } from '../../services/data/data.service';
import { UsersService } from '../../services/users/users.service';
import { MyUsersDocument } from '../../mydb/types/users';
import { Observable } from 'rxjs';

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
  me!: Signal<MyMeDocument>;
  @Input()
  list!: Signal<MyListsDocument>;
  @Input()
  item!: MyItemDocument;

  createdBy$?: Observable<MyUsersDocument>;
  createdBy: WritableSignal<MyUsersDocument | undefined> = signal(undefined);

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

  constructor(
    private bottomSheet: MatBottomSheet,
    public users: UsersService
  ) {
    effect(() => {
      if (this.item && this.list()) {
        this.createdBy$ = this.users.get(this.item.createdBy);
        this.createdBy$.subscribe(u => this.createdBy.set(u));
      }
    })
  }

  toggleDone() {
    if (this.item) {
      this.item.patch({
        done: !this.item.done
      });
    }
  }

  deleteItem(item: MyItemDocument) {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche ' + item.name});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.item && del) {
        this.item.remove();
      }
    });
  }

  userFab(item: MyItemDocument) {
    if (this.list) {
      const index = this.list().users().findIndex(i => i === item.createdBy);
      if (index) {
        return index;
      }
    }
    return 0;
  }

  is_today(item: MyItemDocument): boolean {
    return !!is_today(item);
  }

  openUpdateSheet(event: MouseEvent, item?: MyItemDocument) {
    if (!this.pointerDown && item) {
      this.pointerDown = true;
      const currScrollPos = event.clientY;
      this.pointerPosY = currScrollPos;
      
      setTimeout(() => {
        
        if (this.pointerPosY != undefined &&
            this.pointerDown &&
            !this.updateSheetRef &&
            Math.abs(currScrollPos - this.pointerPosY) < 50
        ) {  
          this.updateSheetRef = this.bottomSheet.open(UpdateItemSheetComponent, {
            data: {
              list: this.list,
              item
            }
          });
  
          this.updateSheetRef.afterDismissed().subscribe(patch => {
            if (this.item && patch) {
              this.item.patch(patch);
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
