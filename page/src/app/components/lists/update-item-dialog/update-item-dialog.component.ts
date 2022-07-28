import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { List, ListItem } from 'src/app/models/lists';

@Component({
  selector: 'app-update-item-dialog',
  templateUrl: './update-item-dialog.component.html',
  styleUrls: ['./update-item-dialog.component.scss']
})
export class UpdateItemDialogComponent {
  form: FormGroup;
  list: List;

  constructor(
    public dialogRef: MatDialogRef<UpdateItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {list:List, item: ListItem},
    private fb: FormBuilder
  ) {
    this.list = data.list;
    this.form = fb.group({
      'name': [data.item.name, Validators.required],
      'time': [data.item.time]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  returnFormContent() {
    this.dialogRef.close({
      'name': this.form.controls['name'].value,
      'time': this.form.controls['time'].value
    });
  }
}
