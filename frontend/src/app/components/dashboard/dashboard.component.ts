import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule, JsonPipe } from '@angular/common';
import { DataApiService } from '../../services/data-api/data-api.service';

import { Checkpoint } from '../../../models/rx.types';
import { DataService } from '../../services/data/data.service';
import { Observable } from 'rxjs';
import { PusherService } from '../../services/pusher/pusher.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    JsonPipe,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  query: string = '{upsertTask(task: {id: "01hzfxc59h671z68yw32apg7xa", name: "a", done: true}){id}}';
  data: object = {};

  checkpoint: Checkpoint = {id: "", updatedAt: "1990-01-01 00:00:00"};

  tasks: Observable<any> | undefined;

  constructor(private authService: AuthService,
              private snackBar: MatSnackBar,
              private api: DataApiService,
              private dataService: DataService,
              public pusher: PusherService) {

    this.dataService.dbInitialized.subscribe(initialized => {
      if (initialized) {
        if (this.dataService.db) {
          this.tasks = this.dataService.db['tasks'].find().$;
        }
      }
    })
  }

  execQuery() {
    this.api.graphQL<any>(this.query).subscribe(res => {
      this.data = res;
    });
  }

  execMutation() {
    this.api.mutation(this.query).subscribe(res => {
      this.data = res;
    });
  }

}
