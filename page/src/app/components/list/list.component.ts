import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { List, ListItem } from 'src/app/models/lists';
import { ListItemService } from 'src/app/services/list-item/list-item.service';
import { ListService } from 'src/app/services/list/list.service';
import { AddSheetComponent } from '../bottom-sheets/add-sheet/add-sheet.component';
import { ShareListSheetComponent } from '../bottom-sheets/share-list-sheet/share-list-sheet.component';
import { UpdateItemSheetComponent } from '../bottom-sheets/update-item-sheet/update-item-sheet.component';

import flatpickr from "flatpickr";
import { groupItems, Slot } from 'src/app/models/categories';
import { is_today } from 'src/app/models/categories_timeslots';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChip } from '@angular/material/chips';
import { Options } from 'flatpickr/dist/types/options';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { ConfirmSheetComponent } from '../bottom-sheets/confirm-sheet/confirm-sheet.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements AfterViewInit {

  list: List | undefined;

  userEmail: string | undefined;

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
    // position: 'above center'
  };
  pickerOpen = false;

  slots: Slot[] = [];
  items: ListItem[] = [];

  pointerDown: boolean = false;
  pointerPosY: number | undefined; 
  updateSheetRef: MatBottomSheetRef<UpdateItemSheetComponent, any> | undefined;

  @ViewChild('itemsContainer') itemsContainer!: ElementRef;
  @ViewChild('picker') picker!: ElementRef;
  @ViewChild('chipDate') chipDiff!: ElementRef;

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent): void  {
    this.pointerPosY = event.clientY;
  }
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    this.pointerPosY = event.changedTouches[0].clientY;
  }

  constructor(
    private listService: ListService,
    private listItemService: ListItemService,
    private activatedRoute: ActivatedRoute,
    private bottomSheet: MatBottomSheet,
    private router: Router,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    public themeService: ThemeService
  ) {
    this.listService.lists.subscribe(() => {
      this.activatedRoute.paramMap.subscribe(params => {
        const list = this.listService.getList(params.get('id'));

        if (!!list) {
          this.list = list;
          this.listItemService.loadItemsForList(list.uuid);
          this.listItemService.items.get(list.uuid)?.subscribe(items => {
            this.items = items;
            this.groupItems(items);
          });
        }
      });
    });

    this.listService.updateData().subscribe();
    this.userEmail = this.authService.loggedUser?.email;
  }

  ngAfterViewInit(): void {
    this.timePicker = flatpickr('#picker', this.timePickerConfig) as flatpickr.Instance;
    this.timePicker.config.onOpen.push(() => this.pickerOpen = true);
  }

  listSettings() {
    if (this.list) {
      const dialogRef = this.bottomSheet.open(AddSheetComponent, {
        data: this.list
      });
  
      dialogRef.afterDismissed().subscribe(new_values => {
        if (!!new_values && new_values.name === '') {
          this.snackbar.open('Name darf nicht leer sein.', 'Ok');
          return;
        }
        
        if (!!new_values && this.list) {
          this.list.name = new_values.name;
          this.list.groceries = new_values.groceries;
          this.listService.updateList(this.list);
        }
      });
    }
  }

  shareList() {
    if (this.list) {
      const dialogRef = this.bottomSheet.open(ShareListSheetComponent);

      dialogRef.afterDismissed().subscribe(data => {
        if (!!data && this.list) {
          this.listService.shareList(data.email, this.list.uuid);
        }
      })
    }
  }

  deleteList() {
    if (this.list) {
      const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche ' + this.list.name});
      
      confirm.afterDismissed().subscribe(del => {
        if (del && this.list) {
          this.listService.deleteList(this.list.uuid).subscribe(success => {
            if (success) {
              this.router.navigate(['/user/lists']);
            }
          });
        }
      })
    }
  }

  groupItems(items: ListItem[]) {
    if (this.list) {
      const slots = groupItems(items, this.list.groceries, this.listService.groceryCategories);

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
      console.log(this.newItemTime.value);
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

      this.listItemService.addItem(this.newItem, this.list.uuid, newTime).subscribe(success => {
        this.newItem = '';
      });
    }
  }
  
  deleteItem(item: ListItem) {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche ' + item.name});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        
        this.listItemService.deleteItems(this.list.uuid, [item.uuid]);
      }
    });
  }

  deleteAll() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        this.listItemService.deleteItems(this.list.uuid, this.items.map(i => i.uuid));
      }
    });
  }

  deleteAllDone() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle erledigten Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        this.listItemService.deleteItems(this.list.uuid, this.items.filter(i => i.done).map(i => i.uuid));
      }
    });
  }

  markAllNotDone() {
    if (this.list) {
      this.listItemService.updateDone(this.list.uuid, this.items.filter(i => i.done).map(i => i.uuid), false).subscribe(success => {
        //TODO: count unmarked items
      });
    }
  }

  toggleDone(item: ListItem, itemList: ListItem[], done: boolean | null = null) {
    if (this.list) {
      const new_done = done !== null ? done : item.done;
      this.listItemService.updateDone(this.list.uuid, [item.uuid], new_done).subscribe(success => {
        //TODO: count unmarked items
      });
    }
  }

  openUpdateSheet(event: MouseEvent, item: ListItem) {
    if (!this.pointerDown) {
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
              newItem.time = newItem.time !== null ? (new Date(newItem.time)).toUTCString() : null;
              newItem.uuid = item.uuid;

              this.listItemService.updateItem(this.list.uuid, newItem);
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

  is_today(item: ListItem): boolean {
    return !!is_today(item);
  }

  toggleNewTimeSelected(chip: MatChip) {
    this.newItemTime.setValue(chip.value);

    if (chip.value !== 'different') {
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

  closeFocusInput() {
    if (!this.pickerOpen) {
      this.focusInput = false;
    }
    this.pickerOpen = this.timePicker.isOpen;
  }
}
