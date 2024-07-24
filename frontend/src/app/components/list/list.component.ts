import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';
import { ShareListSheetComponent } from '../bottom-sheets/share-list-sheet/share-list-sheet.component';

import flatpickr from "flatpickr";
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Options } from 'flatpickr/dist/types/options';
import { ConfirmSheetComponent } from '../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { DataService } from '../../services/data/data.service';
import { AuthService } from '../../services/auth/auth.service';
import { Lists } from '../../../models/rxdb/lists';
import { Slot, groupItems } from '../../../models/categories';
import { ListItem, newItem } from '../../../models/rxdb/list-item';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { DATA_TYPE } from '../../../models/rxdb/graphql-types';
import { RxCollection, RxDocument } from 'rxdb';
import { ListItemComponent } from '../list-item/list-item.component';
import { User } from '../../../models/rxdb/me';
import { timePickerConfig } from '../../../models/time-picker';

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
  me: RxDocument<User> | undefined;
  list: RxDocument<Lists> | undefined;

  itemsDB: RxCollection | undefined;

  newItem = new FormControl('');
  focusInput: boolean = false;
  newItemTime = new FormControl('sometime');
  timePicker!: flatpickr.Instance;
  timePickerDate: Date | undefined;
  pickerOpen = false;

  slots: Slot[] = [];
  items: (RxDocument<ListItem>)[] = [];

  @ViewChild('picker') picker!: ElementRef;
  @ViewChild('addInput') addInput!: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute,
    private bottomSheet: MatBottomSheet,
    private router: Router,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    private dataService: DataService
  ) {
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');

      this.dataService.dbInitialized.subscribe(initialized => {
        if (initialized &&
            this.dataService.db &&
            this.dataService.db[DATA_TYPE.LISTS] &&
            this.dataService.db[DATA_TYPE.LIST_ITEM] &&
            this.dataService.db[DATA_TYPE.ME] &&
            id) {
          this.itemsDB = this.dataService.db[DATA_TYPE.LIST_ITEM];

          this.dataService.db[DATA_TYPE.LISTS].findOne({
            selector: { id }
          }).$.subscribe(lists => {
            this.list = lists;
            this.fetchItems();
          });

          this.itemsDB.$.subscribe(() => {
            this.fetchItems();
          })

          this.dataService.db[DATA_TYPE.ME].findOne().exec().then(u => {
            this.me = u;
          });
        }
      });
    });

    this.newItemTime.valueChanges.subscribe(val => {
      this.toggleNewTimeSelected(val);
    });
  }

  ngAfterViewInit(): void {
    this.timePicker = flatpickr('#picker', timePickerConfig) as flatpickr.Instance;
    this.timePicker.config.onOpen.push(() => this.pickerOpen = true);
  }

  fetchItems() {
    if (this.itemsDB && this.list) {
      this.itemsDB.find({
        selector: {lists: { id: this.list.id }}
      }).exec().then((items: (RxDocument<ListItem>)[]) => {
        console.log('items changed');
        this.items = items;
        this.groupItems(items);
      });
    }
  }

  listSettings() {
    if (this.list) {
      const dialogRef = this.bottomSheet.open(AddSheetComponent, {
        data: this.list.getLatest()
      });
  
      dialogRef.afterDismissed().subscribe(new_values => {
        if (!!new_values && new_values.name === '') {
          this.snackbar.open('Name darf nicht leer sein.', 'Ok');
          return;
        }
        
        if (!!new_values && this.list) {
          const patch = {};
          const list = this.list.getLatest();

          if (list.name !== new_values.name) {
            Object.assign(patch, {name: new_values.name});
          }
          
          if (list.isShoppingList !== new_values.isShoppingList) {
            Object.assign(patch, {isShoppingList: new_values.isShoppingList});
          }

          if (Object.keys(patch).length > 0) {
            this.list.patch(patch);
          }
        }
      });
    }
  }

  shareList() {
    if (this.list) {
      const dialogRef = this.bottomSheet.open(ShareListSheetComponent);

      dialogRef.afterDismissed().subscribe(data => {
        if (!!data && this.list) {
          this.authService.shareLists(data.email, this.list.id).subscribe(success => {
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
    if (this.list) {
      const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche Liste ' + this.list.name});
      
      confirm.afterDismissed().subscribe(del => {
        if (del && this.list) {
          this.list.remove().then(() => {
            this.router.navigate(['/user/lists']);
          });
        }
      })
    }
  }

  groupItems(items: RxDocument<ListItem>[]) {
    if (this.list) {
      const slots = groupItems(items, this.list.isShoppingList, this.dataService.groceryCategories);

      if (this.slots) {
        slots.forEach(s => {
          const this_s = this.slots.find(sl => sl.name === s.name);

          if (this_s) {
            s.collapsed = this_s.collapsed;
          }
        });

        this.slots = slots;
      }
    }
  }
  
  addItem() {
    if (this.list &&
        this.me &&
        this.newItem.value !== '' &&
        this.itemsDB
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
        createdBy: {id: this.me.id, name: this.me.name},
        lists: {id: this.list.id, name: this.list.name}
      };

      this.itemsDB.insert(newItem(item))
        .then(item => {
          this.newItem.reset();
          this.timePickerDate = undefined;
          this.timePicker.clear();
          this.focusInput = false;
          this.newItemTime.setValue('sometime');

          // this.items.push(item);
          // this.groupItems(this.items);
        });
    }
  }


  deleteAll() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del && this.itemsDB) {
        this.itemsDB.find({
          selector: {
            lists: {id: this.list.id}
          }
        }).remove();
      }
    });
  }

  deleteAllDone() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle erledigten Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del && this.itemsDB) {
        this.itemsDB.find({
          selector: {
            lists: {id: this.list.id},
            done: true
          }
        }).remove();
      }
    });
  }

  markAllNotDone() {
    if (this.list && this.itemsDB) {
      this.itemsDB.find({
        selector: {
          lists: {id: this.list.id}
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

    if (this.list) {
      let listStr = this.list.name + '\n\n';
      this.slots.forEach(slot => {
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
        navigator.share({text: listStr, title: this.list.name});
      } else {
        navigator.clipboard.writeText(this.list.name + '\n\n' + listStr);
        this.snackbar.open('Liste in die Zwischenablage kopiert!', 'Ok');
      }
    }
  }
}
