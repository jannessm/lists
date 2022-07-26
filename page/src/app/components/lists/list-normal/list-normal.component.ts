import { Component, OnInit } from '@angular/core';
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
export class ListNormalComponent implements OnInit {

  list: List = {
    uuid: '',
    name: '',
    groceries: false,
  };

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
        this.list = this.listService.getList(params.get('id'));
      });
    });

    this.listService.updateData().subscribe();
  }

  ngOnInit(): void {
  }

  listSettings() {
    const dialogRef = this.dialog.open(AddDialogComponent, {
      data: this.list
    });

    dialogRef.afterClosed().subscribe(new_values => {
      if (!!new_values) {
        this.listService.updateList({
          uuid: this.list.uuid,
          name: new_values.name,
          groceries: new_values.groceries
        }).subscribe();
      }
    })
  }

  deleteList() {
    this.listService.deleteList(this.list.uuid).subscribe(success => {
      if (success) {
        this.router.navigate(['/user/lists']);
      }
    })
  }

  toggleDone(item: ListItem) {
    item.done = !item.done;
  }

  deleteItem(item: ListItem) {

  }
}
