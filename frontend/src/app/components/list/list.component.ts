import { AfterViewInit, Component, ElementRef, Signal, ViewChild, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';
import { ShareListSheetComponent } from '../bottom-sheets/share-list-sheet/share-list-sheet.component';

import flatpickr from "flatpickr";
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmSheetComponent } from '../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { DataService } from '../../services/data/data.service';
import { AuthService } from '../../services/auth/auth.service';
import { RxListsDocument } from '../../mydb/types/lists';
import { Slot, groupItems } from '../../../models/categories';
import { RxItemDocument, newItem } from '../../mydb/types/list-item';
import { CommonModule, Location } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { ListItemComponent } from '../list-item/list-item.component';
import { RxMeDocument } from '../../mydb/types/me';
import { timePickerConfig } from '../../../models/time-picker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    RouterModule,
    ReactiveFormsModule,
    NameBadgePipe,
    ListItemComponent
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements AfterViewInit {
  @ViewChild('picker') picker!: ElementRef;
  @ViewChild('addInput') addInput!: ElementRef;
  
  me: Signal<RxMeDocument>;
  list!: Signal<RxListsDocument>;
  listItems!: Signal<RxItemDocument[]>;

  newItem = new FormControl('');
  focusInput: boolean = false;
  newItemTime = new FormControl('sometime');
  newItemSub: Subscription;
  timePicker!: flatpickr.Instance;
  timePickerDate: Date | undefined;
  pickerOpen = false;

  slots: Signal<Slot[]> = computed(() => {
    if (this.listItems() && this.list()) {
      console.log('group items');
      return this.groupItems(this.list(), this.listItems());
    }
    return [];
  });
  slotCollapseStates: {[key: string]: boolean} = {};

  constructor(
    private location: Location,
    private bottomSheet: MatBottomSheet,
    private router: Router,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    private dataService: DataService
  ) {
    this.me = this.authService.me;
    const id = this.location.path(false).split('/').pop();

    if (!!id) {
      this.list = this.dataService.db.lists.findOne({
        selector: { id }
      }).$$ as Signal<RxListsDocument>;

      this.listItems = this.dataService.db.items.find({
        selector: {lists: id }
      }).$$ as Signal<RxItemDocument[]>;

      this.dataService.db.items.$.subscribe((ev) => console.log('db changed'));
    } else {
      this.router.navigateByUrl('/user/lists');
    }

    this.newItemSub = this.newItemTime.valueChanges.subscribe(val => {
      this.toggleNewTimeSelected(val);
    });
  }

  ngAfterViewInit(): void {
    this.timePicker = flatpickr('#picker', timePickerConfig) as flatpickr.Instance;
    this.timePicker.config.onOpen.push(() => this.pickerOpen = true);
  }

  ngOnDestroy() {
    this.newItemSub.unsubscribe();
  }

  listSettings() {
    if (this.list && this.list()) {
      const dialogRef = this.bottomSheet.open(AddSheetComponent, {
        data: this.list().getLatest()
      });
  
      dialogRef.afterDismissed().subscribe(new_values => {
        if (!!new_values && new_values.name === '') {
          this.snackbar.open('Name darf nicht leer sein.', 'Ok');
          return;
        }
        
        if (!!new_values && this.list) {
          const patch = {clientUpdatedAt: (new Date()).toISOString()};
          const list = this.list().getLatest();

          if (list.name !== new_values.name) {
            Object.assign(patch, {name: new_values.name});
          }
          
          if (list.isShoppingList !== new_values.isShoppingList) {
            Object.assign(patch, {isShoppingList: new_values.isShoppingList});
          }

          if (Object.keys(patch).length > 0) {
            this.list().patch(patch);
          }
        }
      });
    }
  }

  shareList() {
    if (this.list && this.list()) {
      const dialogRef = this.bottomSheet.open(ShareListSheetComponent);

      dialogRef.afterDismissed().subscribe(data => {
        if (!!data && this.list && this.list()) {
          this.authService.shareLists(data.email, this.list().id).subscribe(success => {
            if (!success) {
              this.snackbar.open('Einladung konnte nicht verschickt werden.', 'Ok');
            }
            this.snackbar.open('Einladung zum Beitreten der Liste wurde verschickt.', 'Ok');
          });
        }
      })
    }
  }

  deleteList() {
    if (this.list && this.list()) {
      const confirm = this.bottomSheet.open(ConfirmSheetComponent, {
        data: 'Lösche Liste ' + this.list().name
      });
      
      confirm.afterDismissed().subscribe(del => {
        if (del && this.list && this.list()) {
          this.list().remove().then(() => {
            this.router.navigate(['/user/lists']);
          });
        }
      })
    }
  }

  groupItems(list: RxListsDocument, items: RxItemDocument[]): Slot[] {
    if (items && list) {
      const slots = groupItems(items, list.isShoppingList, this.dataService.groceryCategories);

      slots.forEach(s => {
        if (!(s.name in this.slotCollapseStates)) {
          this.slotCollapseStates[s.name] = true;
        }
      });

      return slots;
    }

    return [];
  }
  
  addItem() {
    if (this.list && this.list() &&
        this.me && this.me() &&
        this.newItem.value !== ''
      ) {
      let newTime: string | Date = '';

      switch(this.newItemTime.value) {
        case 'today':
          newTime = new Date();
          newTime.setHours(9, 0);
          newTime = newTime.toISOString();
          break;
        case 'tomorrow':
          newTime = new Date();
          newTime.setDate(newTime.getDate() + 1);
          newTime.setHours(9, 0);
          newTime = newTime.toISOString();
          break;
        case 'different':
          if (this.timePickerDate) {
            newTime = this.timePickerDate;
            newTime = newTime.toISOString();
          }
      }

      const item = {
        name: this.newItem.value,
        due: newTime,
        createdBy: {id: this.me().id, name: this.me.name},
        lists: this.list().id
      };

      this.dataService.db.items.insert(newItem(item))
        .then(() => {
          this.newItem.reset();
          this.timePickerDate = undefined;
          this.timePicker.clear();
          this.focusInput = false;
          this.newItemTime.setValue('sometime');
        });
    }
  }


  deleteAll() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && this.list() && del) {
        this.dataService.db.items.find({
          selector: {
            lists: this.list().id
          }
        }).remove();
      }
    });
  }

  deleteAllDone() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle erledigten Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && this.list() && del) {
        this.dataService.db.items.find({
          selector: {
            lists: this.list().id,
            done: true
          }
        }).remove();
      }
    });
  }

  markAllNotDone() {
    if (this.list && this.list()) {
      this.dataService.db.items.find({
        selector: {
          lists: this.list().id
        }
      }).patch({
        done: false
      });
    }
  }

  toggleNewTimeSelected(value: string | null) {
    if (value === null) {
      this.addInput.nativeElement.focus();
    }

    if (value !== 'different') {
      this.timePicker.clear();
      this.timePickerDate = undefined;
      this.addInput.nativeElement.focus();
    } else {
      this.timePicker.open();
    }
  }

  setTimePickerDate(event: any) {
    if (event.target.value !== '') {
      this.timePickerDate = this.timePicker.selectedDates[0];
    } else {
      this.timePickerDate = undefined;
    }
  }

  openFocusInput(event: Event) {
    event.stopPropagation();
    this.focusInput = true;
  }

  closeFocusInput(event: Event) {
    if (!this.pickerOpen && this.focusInput) {
      this.focusInput = false;
      event.stopPropagation();
    } else if (this.pickerOpen) {
      event.stopPropagation();
      this.pickerOpen = this.timePicker.isOpen;
      this.timePicker.close();

      if (!this.timePickerDate) {
        this.newItemTime.setValue('sometime');
      }
      this.addInput.nativeElement.focus();
    }
  }

  listToText() {
    const done = '✓';
    const open = '☐';
    const indent = '  ';

    if (this.list()) {
      let listStr = this.list().name + '\n\n';
      this.slots().forEach(slot => {
        if (slot.items.length > 0) {
          
          listStr += indent + slot.name + '\n\n';
          
          slot.items.forEach(item => {
            const mark = item.done ? done : open;
            listStr += indent + indent + mark + ' ' + item.name + '\n';
          });
          
          listStr += '\n';
        }
        
      });

      // check if mobile
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !!navigator.share) {
        navigator.share({text: listStr, title: this.list().name});
      } else {
        navigator.clipboard.writeText(this.list().name + '\n\n' + listStr);
        this.snackbar.open('Liste in die Zwischenablage kopiert!', 'Ok');
      }
    }
  }
}
