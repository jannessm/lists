import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { List, ListItem } from 'src/app/models/lists';
import { ListItemService } from 'src/app/services/list-item/list-item.service';
import { ListService } from 'src/app/services/list/list.service';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';
import { ShareListDialogComponent } from '../share-list-dialog/share-list-dialog.component';
import { UpdateItemDialogComponent } from '../update-item-dialog/update-item-dialog.component';

import flatpickr from "flatpickr";
import { groupItems, Slot } from 'src/app/models/categories';
import { is_today } from 'src/app/models/categories_timeslots';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteSheetComponent } from '../confirm-delete-sheet/confirm-delete-sheet.component';
import { MatChip } from '@angular/material/chips';
import { Options } from 'flatpickr/dist/types/options';
import { ThemeService } from 'src/app/services/theme/theme.service';

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
  updateDialogRef: MatBottomSheetRef<UpdateItemDialogComponent, any> | undefined;

  @ViewChild('itemsContainer') itemsContainer!: ElementRef;
  @ViewChild('picker') picker!: ElementRef;
  @ViewChild('chipDate') chipDiff!: ElementRef;

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onMousemove(event: MouseEvent): void  {
    this.pointerPosY = event.clientY;
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
      const dialogRef = this.bottomSheet.open(AddDialogComponent, {
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
      const dialogRef = this.bottomSheet.open(ShareListDialogComponent);

      dialogRef.afterDismissed().subscribe(data => {
        if (!!data && this.list) {
          this.listService.shareList(data.email, this.list.uuid);
        }
      })
    }
  }

  deleteList() {
    if (this.list) {
      const confirm = this.bottomSheet.open(ConfirmDeleteSheetComponent, {data: this.list.name});
      
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
    const confirm = this.bottomSheet.open(ConfirmDeleteSheetComponent, {data: item.name});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        
        this.listItemService.deleteItems(this.list.uuid, [item.uuid]);
      }
    });
  }

  deleteAll() {
    const confirm = this.bottomSheet.open(ConfirmDeleteSheetComponent, {data: 'alle Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.list && del) {
        this.listItemService.deleteItems(this.list.uuid, this.items.map(i => i.uuid));
      }
    });
  }

  deleteAllDone() {
    const confirm = this.bottomSheet.open(ConfirmDeleteSheetComponent, {data: 'alle erledigten Einträge'});
    
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

  openUpdateDialog(event: MouseEvent, item: ListItem) {
    if (!this.pointerDown) {
      this.pointerDown = true;
      const currScrollPos = event.clientY;
      
      setTimeout(() => {

        if (this.pointerPosY != undefined && this.pointerDown && !this.updateDialogRef && Math.abs(currScrollPos - this.pointerPosY) < 50) {  
          this.updateDialogRef = this.bottomSheet.open(UpdateItemDialogComponent, {
            data: {
              list: this.list,
              item
            }
          });
  
          this.updateDialogRef.afterDismissed().subscribe(newItem => {            
            if (this.list && newItem) {
              newItem.time = newItem.time !== null ? (new Date(newItem.time)).toUTCString() : null;
              newItem.uuid = item.uuid;

              this.listItemService.updateItem(this.list.uuid, newItem);
            }

            setTimeout(() => {
              this.cancelUpdateDialog();
            }, 500);
          });
        } else {
          this.cancelUpdateDialog();
        }
      }, 500);
    }
  }

  cancelUpdateDialog() {
    this.pointerDown = false;
    this.updateDialogRef = undefined;
  }

  is_today(item: ListItem): boolean {
    return !!is_today(item);
  }

  toggleNewTimeSelected(chip: MatChip) {
    chip.selected = true;

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
