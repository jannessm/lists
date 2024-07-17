import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';
import { ShareListSheetComponent } from '../bottom-sheets/share-list-sheet/share-list-sheet.component';
import { UpdateItemSheetComponent } from '../bottom-sheets/update-item-sheet/update-item-sheet.component';

import flatpickr from "flatpickr";
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Options } from 'flatpickr/dist/types/options';
import { ConfirmSheetComponent } from '../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { DataService } from '../../services/data/data.service';
import { AuthService } from '../../services/auth/auth.service';
import { Lists } from '../../../models/rxdb/lists';
import { Slot, groupItems } from '../../../models/categories';
import { ListItem } from '../../../models/rxdb/list-item';
import { is_today } from '../../../models/categories_timeslots';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { DATA_TYPE } from '../../../models/rxdb/graphql-types';
import { RxDocument } from 'rxdb';
import { environment } from '../../../environments/environment';
import { ListItemComponent } from '../list-item/list-item.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NameBadgePipe,
    ListItemComponent
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements AfterViewInit {

  list: RxDocument<Lists> | undefined;

  userId: string | undefined;

  newItem: string = '';
  focusInput: boolean = false;
  newItemTime = new FormControl('sometime');
  timePicker!: flatpickr.Instance;
  timePickerDate: Date | undefined;
  timePickerConfig: Options = {
    enableTime: true,
    minuteIncrement: 5,
    disableMobile: true,
    time_24hr: true,
  };
  pickerOpen = false;

  slots: Slot[] = [];
  items: (RxDocument<ListItem>)[] = [];

  @ViewChild('toolbar-time') toolbar!: Element;
  @ViewChild('itemsContainer') itemsContainer!: ElementRef;
  @ViewChild('picker') picker!: ElementRef;
  @ViewChild('chipDate') chipDiff!: ElementRef;

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
        if (initialized && this.dataService.db && this.dataService.db[DATA_TYPE.LISTS] && this.dataService.db[DATA_TYPE.LIST_ITEM]) {
          this.dataService.db[DATA_TYPE.LISTS].findOne({
            selector: { id }
          }).$.subscribe(lists => {
            this.list = lists;
            console.log(this.list);
          });

          this.dataService.db[DATA_TYPE.LIST_ITEM].find({
            selector: {lists: { id }}
          }).$.subscribe((items: (RxDocument<ListItem>)[]) => {
            console.log(items);
            this.items = items;
            this.groupItems(items);
          });

          this.dataService.db[DATA_TYPE.ME].findOne().exec().then(u => {
            this.userId = u.id;
          });
        }
      });
    });

    this.newItemTime.valueChanges.subscribe(this.toggleNewTimeSelected.bind(this));
  }

  ngAfterViewInit(): void {
    this.timePicker = flatpickr('#picker', this.timePickerConfig) as flatpickr.Instance;
    this.timePicker.config.onOpen.push(() => this.pickerOpen = true);
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
          this.list.name = new_values.name;
          this.list.isShoppingList = new_values.isShoppingList;
          // this.listService.updateList(this.list);
        }
      });
    }
  }

  shareList() {
    if (this.list) {
      const dialogRef = this.bottomSheet.open(ShareListSheetComponent);

      dialogRef.afterDismissed().subscribe(data => {
        if (!!data && this.list) {
          // this.listService.shareList(data.email, this.list.uuid);
        }
      })
    }
  }

  deleteList() {
    if (this.list) {
      const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche ' + this.list.name});
      
      confirm.afterDismissed().subscribe(del => {
        if (del && this.list) {
          // this.listService.deleteList(this.list.uuid).subscribe(success => {
          //   if (success) {
          //     this.router.navigate(['/user/lists']);
          //   }
          // });
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
    if (this.list && this.newItem !== '') {
      let newTime = null;

      switch(this.newItemTime.value) {
        case 'today':
          newTime = new Date();
          newTime.setHours(9, 0);
          break;
        case 'tomorrow':
          newTime = new Date();
          newTime.setDate(newTime.getDate() + 1);
          newTime.setHours(9, 0);
          break;
        case 'different':
          if (this.timePickerDate) {
            newTime = this.timePickerDate;
          }
      }

      setTimeout(() => {
        this.timePickerDate = undefined;
        this.timePicker.clear();
        this.focusInput = false;
        this.newItemTime.setValue('sometime');
      }, 1);

      // this.listItemService.addItem(this.newItem, this.list.uuid, newTime).subscribe(success => {
      //   this.newItem = '';
      // });
    }
  }


  deleteAll() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        // this.listItemService.deleteItems(this.list.uuid, this.items.map(i => i.uuid));
      }
    });
  }

  deleteAllDone() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle erledigten Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        // this.listItemService.deleteItems(this.list.uuid, this.items.filter(i => i.done).map(i => i.uuid));
      }
    });
  }

  markAllNotDone() {
    if (this.list) {
      // this.listItemService.updateDone(this.list.uuid, this.items.filter(i => i.done).map(i => i.uuid), false).subscribe(success => {
        //TODO: count unmarked items
      // });
    }
  }

  toggleNewTimeSelected(value: string | null) {
    if (value === null) return;

    // console.log(value, this.timePicker);

    if (value !== 'different') {
      this.timePicker.clear();
      this.timePickerDate = undefined;
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
