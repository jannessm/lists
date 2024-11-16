import { Component, EventEmitter, Input, OnDestroy, Output, Signal, WritableSignal, effect, signal } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { MyItemDocument } from '../../../mydb/types/list-item';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { UpdateItemSheetComponent } from '../../bottom-sheets/update-item-sheet/update-item-sheet.component';
import { MyListsDocument } from '../../../mydb/types/lists';
import { ConfirmSheetComponent } from '../../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { NameBadgePipe } from '../../../pipes/name-badge.pipe';
import { is_today } from '../../../../models/categories_timeslots';
import { FormsModule } from '@angular/forms';
import { MyMeDocument } from '../../../mydb/types/me';
import { UsersService } from '../../../services/users/users.service';
import { MyUsersDocument } from '../../../mydb/types/users';
import { Observable, Subscription } from 'rxjs';

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
export class ListItemComponent implements OnDestroy {
  @Input()
  me!: Signal<MyMeDocument>;
  @Input()
  list!: Signal<MyListsDocument>;
  @Input()
  item!: MyItemDocument;

  createdBy$?: Observable<MyUsersDocument>;
  createdBySub?: Subscription;
  createdBy: WritableSignal<MyUsersDocument | undefined> = signal(undefined);

  constructor(
    public users: UsersService,
    private bottomSheet: MatBottomSheet,
  ) {
    effect(() => {
      if (this.item && this.list()) {
        this.createdBy$ = this.users.get(this.item.createdBy);
        this.createdBySub?.unsubscribe();
        this.createdBySub = this.createdBy$.subscribe(u => this.createdBy.set(u));
      }
    })
  }

  ngOnDestroy() {
    this.createdBySub?.unsubscribe();
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

  openEditSheet(item: MyItemDocument) {
    const updateSheetRef = this.bottomSheet.open(UpdateItemSheetComponent, {
      data: {
        list: this.list,
        item
      }
    });

    updateSheetRef.afterDismissed().subscribe(patch => {
      if (this.item && patch) {
        this.item.patch(patch);
      }
    });
  }
}
