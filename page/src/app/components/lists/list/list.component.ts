import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { List, ListItem } from 'src/app/models/lists';
import { ListItemService } from 'src/app/services/list-item/list-item.service';
import { ListService } from 'src/app/services/list/list.service';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';
import { ShareListDialogComponent } from '../share-list-dialog/share-list-dialog.component';
import { UpdateItemDialogComponent } from '../update-item-dialog/update-item-dialog.component';

import flatpickr from "flatpickr";
import { MatChip } from '@angular/material/chips';
import { groupItems, Slot, sortItems } from 'src/app/models/categories';
import { is_today } from 'src/app/models/categories_timeslots';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements AfterViewInit{

  list: List | undefined;

  userEmail: string | undefined;

  newItem: string = '';
  focusInput: boolean = false;
  newItemTime = new FormControl('sometime');
  timePicker: flatpickr.Instance;
  timePickerDate: Date | undefined;
  timePickerConfig = {
    enableTime: true,
    minuteIncrement: 5,
    disableMobile: true,
    time_24hr: true
  };
  pickerOpen = false;

  slots: Slot[] = [];
  items: ListItem[] = [];

  pointerDown: boolean = false;
  pointerPosY: number | undefined; 
  updateDialogRef: MatDialogRef<UpdateItemDialogComponent, any> | undefined;

  @ViewChild('itemsContainer') itemContainer!: ElementRef;
  @ViewChild('picker') picker!: ElementRef;

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onMousemove(event: MouseEvent): void  {
    this.pointerPosY = event.clientY;
  }

  constructor(
    private listService: ListService,
    private listItemService: ListItemService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
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
    this.timePicker = flatpickr('#picker', this.timePickerConfig) as flatpickr.Instance;

    this.userEmail = this.authService.loggedUser?.email;
  }

  ngAfterViewInit(): void {
    this.timePicker = flatpickr('#picker', this.timePickerConfig) as flatpickr.Instance;
  }

  listSettings() {
    if (this.list) {
      const dialogRef = this.dialog.open(AddDialogComponent, {
        data: this.list
      });
  
      dialogRef.afterClosed().subscribe(new_values => {
        if (!!new_values && this.list) {
          this.listService.updateList({
            uuid: this.list.uuid,
            name: new_values.name,
            groceries: new_values.groceries,
            shared: this.list.shared,
            users: this.list.users
          }).subscribe();
        }
      });
    }
  }

  shareList() {
    if (this.list) {
      const dialogRef = this.dialog.open(ShareListDialogComponent);

      dialogRef.afterClosed().subscribe(data => {
        if (!!data && this.list) {
          this.listService.shareList(data.email, this.list.uuid);
        }
      })
    }
  }

  deleteList() {
    if (this.list) {
      this.listService.deleteList(this.list.uuid).subscribe(success => {
        if (success) {
          this.router.navigate(['/user/lists']);
        }
      });
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
    if (this.list) {
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
    if (this.list) {
      this.listItemService.deleteItems(this.list.uuid, [item.uuid]);
    }
  }

  deleteAll() {
    if (this.list) {
      this.listItemService.deleteItems(this.list.uuid, this.items.map(i => i.uuid));
    }
  }

  deleteAllDone() {
    if (this.list) {
      this.listItemService.deleteItems(this.list.uuid, this.items.filter(i => i.done).map(i => i.uuid));
    }
  }

  markAllNotDone() {
    if (this.list) {
      this.listItemService.updateDone(this.list.uuid, this.items.map(i => i.uuid), false).subscribe(success => {
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
          this.updateDialogRef = this.dialog.open(UpdateItemDialogComponent, {
            data: {
              list: this.list,
              item
            }
          });
  
          this.updateDialogRef.afterClosed().subscribe(newItem => {            
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
    if (this.pickerOpen) {
      this.timePicker.close();
      this.pickerOpen = false;

    } else {
      chip.toggleSelected(true);

      if (chip.value !== 'different') {
        this.timePicker.clear();
        this.timePickerDate = undefined;
      }
    }
  }

  pickerToggleFocus() {
    if (this.newItemTime.value === 'different') {
      this.timePicker.open();
      this.pickerOpen = true;
    } else {
      this.timePicker.close();
      this.pickerOpen = false;
    }
  }

  setTimePickerDate(event: any) {
    if (event.target.value !== '') {
      this.timePickerDate = this.timePicker.selectedDates[0];
    } else {
      this.timePickerDate = undefined;
    }
  }
}
