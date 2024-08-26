import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, Signal, WritableSignal, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MaterialModule } from '../../../material.module';
import { MyListsDocument } from '../../../mydb/types/lists';
import { NameBadgePipe } from '../../../pipes/name-badge.pipe';
import { MyUsersDocument } from '../../../mydb/types/users';
import { Observable, Subscription } from 'rxjs';
import { DataService } from '../../../services/data/data.service';

@Component({
  selector: 'app-share-list-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    NameBadgePipe,
    MatAutocompleteModule
  ],
  templateUrl: './share-list-sheet.component.html',
  styleUrls: ['./share-list-sheet.component.scss', '../styles.scss']
})
export class ShareListSheetComponent implements OnDestroy {

  lists: Signal<MyListsDocument>;
  isAdmin: boolean;
  allUsers$?: Observable<MyUsersDocument[]>;
  allUsersSubscription?: Subscription;
  allUsers: WritableSignal<MyUsersDocument[]> = signal([]);
  users: Signal<MyUsersDocument[]>;
  filteredUsers: WritableSignal<MyUsersDocument[]> = signal([]);
  form: FormGroup;

  subscriptions: Subscription[] = [];
  allUsersSub?: Subscription;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ShareListSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {
      lists: Signal<MyListsDocument>,
      users: Signal<MyUsersDocument[]>,
      isAdmin: boolean
    },
    private fb: FormBuilder,
    private dataService: DataService) {

    this.lists = data.lists;
    this.isAdmin = data.isAdmin;
    this.users = data.users;
    
    this.form = fb.group({
      'email': ['', Validators.required]
    });

    effect(() => {
      this.allUsers$ = this.dataService.db.users.find({
        neqSelector: {
          id: this.users().map(u => u.id)
        }
      }).$ as Observable<any[]>;

      this.allUsersSub?.unsubscribe();

      this.allUsersSub = this.allUsers$.subscribe(user => {
        this.allUsers.set(user)
        this.filteredUsers.set(user.filter(u => u.email.includes(this.form.get('email')?.value)));
      });
    });

    const sub = this.form.get('email')?.valueChanges.subscribe(val => {
      this.filteredUsers.set(this.allUsers().filter(u => u.email.includes(val)));
    });

    if (sub) {
      this.subscriptions.push(sub);
    }
  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  unsubscribe() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.allUsersSub?.unsubscribe();
  }

  returnFormContent() {
    let resp;
    if (this.isAdmin) {
      resp = {
        'email': this.form.controls['email'].value.toLowerCase().trim()
      };
    }
    this.bottomSheetRef.dismiss(resp);
  }

  removeSharedWith(userId: string) {
    let resp;
    if (this.isAdmin) {
      resp = {
        'remove': userId
      };
    }
    this.bottomSheetRef.dismiss(resp);
  }
}
