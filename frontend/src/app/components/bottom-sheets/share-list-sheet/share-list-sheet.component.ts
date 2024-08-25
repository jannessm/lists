import { CommonModule } from '@angular/common';
import { Component, Inject, Signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';
import { MyListsDocument } from '../../../mydb/types/lists';
import { NameBadgePipe } from '../../../pipes/name-badge.pipe';
import { MyUsersDocument } from '../../../mydb/types/users';

@Component({
  selector: 'app-share-list-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    NameBadgePipe
  ],
  templateUrl: './share-list-sheet.component.html',
  styleUrls: ['./share-list-sheet.component.scss', '../styles.scss']
})
export class ShareListSheetComponent {

  lists: Signal<MyListsDocument>;
  isAdmin: boolean;
  users: Signal<MyUsersDocument[]>;
  form: FormGroup;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ShareListSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {
      lists: Signal<MyListsDocument>,
      users: Signal<MyUsersDocument[]>,
      isAdmin: boolean
    },
    private fb: FormBuilder) {

    this.lists = data.lists;
    this.isAdmin = data.isAdmin;
    this.users = data.users;
    
    this.form = fb.group({
      'email': ['', Validators.required]
    });


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
