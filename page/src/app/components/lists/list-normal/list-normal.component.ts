import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { is_past, is_sometime, is_soon, is_today, is_tomorrow, List, ListItem, Timeslot, TIMESLOTS } from 'src/app/models/lists';
import { ListItemService } from 'src/app/services/list-item/list-item.service';
import { ListService } from 'src/app/services/list/list.service';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';
import { ShareListDialogComponent } from '../share-list-dialog/share-list-dialog.component';
import { UpdateItemDialogComponent } from '../update-item-dialog/update-item-dialog.component';

@Component({
  selector: 'app-list-normal',
  templateUrl: './list-normal.component.html',
  styleUrls: ['./list-normal.component.scss']
})
export class ListNormalComponent {

  list: List | undefined;

  new_item: string = '';

  timeslots: Timeslot[] = [];
  items: ListItem[] = [];

  pointerDown: boolean = false;
  pointerPosX: number | undefined; 
  updateDialogRef: MatDialogRef<UpdateItemDialogComponent, any> | undefined;

  @ViewChild('itemsContainer') itemContainer!: ElementRef;

  constructor(
    private listService: ListService,
    private listItemService: ListItemService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
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
            groceries: new_values.groceries
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
    this.timeslots = [];
    let categories = [];
    
    if (this.list?.groceries) {
      categories = [
        {condition: () => true, name: TIMESLOTS.NONE}
      ];

    } else {
      categories = [
        {condition: [is_today, is_past], name: TIMESLOTS.TODAY},
        {condition: is_tomorrow, name: TIMESLOTS.TOMORROW},
        {condition: is_soon, name: TIMESLOTS.SOON},
        {condition: is_sometime, name: TIMESLOTS.SOMETIME},
      ];
    }

    categories.forEach(cat => {
      const cat_items = items.filter(i => {
        if (Array.isArray(cat.condition)) {
          return cat.condition.reduce((cond, fn) => fn(i.time) || cond, false);
        } else {
          return cat.condition(i.time)
        }
      });
      this.sortItems(cat_items);

      if (cat_items.length > 0) {
        this.timeslots.push({name: cat.name, items: cat_items});
      }
    });

    if (this.list && this.timeslots.length > 0 && this.timeslots[0].name === TIMESLOTS.TODAY) {
      // this.list.todo = this.timeslots[0].items.reduce((todo, i) => !i.done ? todo + 1 : todo, 0); TODO: fix badge on overview
    }
    if (this.list && this.timeslots.length > 0 && this.list.todo && this.list.todo < 1) {
      this.list.todo = undefined;
    }
  }
  
  addItem() {
    if (this.list) {
      this.listItemService.addItem(this.new_item, this.list.uuid).subscribe(success => {
        this.new_item = '';
      });
    }
  }
  
  deleteItem(item: ListItem) {
    if (this.list) {
      this.listItemService.deleteItem(this.list.uuid, item.uuid);
    }
  }

  toggleDone(item: ListItem, itemList: ListItem[]) {
    if (this.list) {
      this.listItemService.updateDone(this.list.uuid, item.uuid, item.done).subscribe(success => {
        if (!success && this.list) {
          item.done = !item.done;

          if (this.list.todo) {
            // this.list.todo += item.done ? -1 : 1;
            // this.list.todo = this.list.todo < 1 ? undefined : this.list.todo;
          }
        } else {
          this.sortItems(itemList);
        }
      });
    }
  }

  sortItems(items: ListItem[]) {
    items.sort((a, b) => {
      const c = a.done ? 1 : 0;
      const d = b.done ? 1 : 0;

      if (c - d == 0) {
        return a.name.localeCompare(b.name);
      }

      return c - d;
    });
  }

  openUpdateDialog(item: ListItem) {
    
    if (!this.pointerDown) {
      this.pointerDown = true;
      this.pointerPosX = this.itemContainer.nativeElement.scrollTop;

      setTimeout(() => {
        const currScrollPos = this.itemContainer.nativeElement.scrollTop;
        if (this.pointerPosX != undefined)
          console.log(Math.abs(currScrollPos - this.pointerPosX) < 50);
        if (this.pointerPosX != undefined && this.pointerDown && !this.updateDialogRef && Math.abs(currScrollPos - this.pointerPosX) < 50) {  
          this.updateDialogRef = this.dialog.open(UpdateItemDialogComponent, {
            data: {
              list: this.list,
              item
            }
          });
  
          this.updateDialogRef.afterClosed().subscribe(new_item => {            
            if (this.list && new_item) {
              new_item.time = (new Date(new_item.time)).toUTCString();
              new_item.uuid = item.uuid;

              this.listItemService.updateItem(this.list.uuid, new_item);
            }

            setTimeout(() => {
              this.cancelUpdateDialog();
            }, 300);
          });
        }
      }, 500);
    }
  }

  cancelUpdateDialog() {
    this.pointerDown = false;
    this.pointerPosX = undefined;
  }

  is_today(time: Date): boolean {
    return is_today(time);
  }
}
