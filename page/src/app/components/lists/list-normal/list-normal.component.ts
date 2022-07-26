import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { List, ListItem, Timeslot, TIMESLOTS } from 'src/app/models/lists';
import { ListService } from 'src/app/services/list/list.service';
import { AddDialogComponent } from '../add-dialog/add-dialog.component';

@Component({
  selector: 'app-list-normal',
  templateUrl: './list-normal.component.html',
  styleUrls: ['./list-normal.component.scss']
})
export class ListNormalComponent implements AfterViewInit {

  list: List | undefined;

  timeslots: Timeslot[] = [{
    name: TIMESLOTS.TODAY,
    items: [{
      uuid: '',
      done: false,
      time: undefined,
      name: 'test',
      created_by: ''
    }]
  }];

  constructor(
    private listService: ListService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
  ) {
    this.listService.lists.subscribe(() => {
      this.activatedRoute.paramMap.subscribe(params => {
        const list = this.listService.getList(params.get('id'));

        if (!!list) {
          this.list = list
        }
      });
    });

    this.listService.updateData().subscribe();
  }

  ngAfterViewInit(): void {
    if (!this.list) {
      this.router.navigate(['/user/lists']);
    }
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
        console.log(success);
        if (success) {
          this.router.navigate(['/user/lists']);
        }
      });
    }
  }

  toggleDone(item: ListItem) {
    item.done = !item.done;
  }

  deleteItem(item: ListItem) {

  }
}
