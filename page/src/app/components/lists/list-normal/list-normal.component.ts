import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { is_sometime, is_soon, is_today, is_tomorrow, List, ListItem, Timeslot, TIMESLOTS } from 'src/app/models/lists';
import { ListItemService } from 'src/app/services/list-item/list-item.service';
import { ListService } from 'src/app/services/list/list.service';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';

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
    
    if (this.list?.groceries) {

    } else {
      const categories = [
        {condition: is_today, name: TIMESLOTS.TODAY},
        {condition: is_tomorrow, name: TIMESLOTS.TOMORROW},
        {condition: is_soon, name: TIMESLOTS.SOON},
        {condition: is_sometime, name: TIMESLOTS.SOMETIME},
      ];

      categories.forEach(cat => {
        const cat_items = items.filter(i => cat.condition(i.time));
        this.sortItems(cat_items);

        if (cat_items.length > 0) {
          this.timeslots.push({name: cat.name, items: cat_items});
        }
      });
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
    
  }

  toggleDone(item: ListItem, itemList: ListItem[]) {
    if (this.list) {
      this.listItemService.updateDone(this.list.uuid, item.uuid, item.done).subscribe(success => {
        if (!success) {
          item.done = !item.done;
        } else {
          this.sortItems(itemList);
        }
      });
    }
  }

  sortItems(items: ListItem[]) {
    console.log('sort');
    items.sort((a, b) => {
      const c = a.done ? 1 : 0;
      const d = b.done ? 1 : 0;

      if (c - d == 0 && a.time && !b.time) {
        return -1;
      } else if (c - d == 0 && !a.time && b.time) {
        return 1;
      } else if (c - d == 0 && a.time && b.time) {
        return a.time.getTime() - b.time.getTime();
      } else if (c - d == 0) {
        return a.name.localeCompare(b.name);
      }

      return c - d;
    });
  }
}
