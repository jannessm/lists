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
  timezone: string | undefined;

  constructor(
    public dialogRef: MatDialogRef<UpdateItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {list:List, item: ListItem},
    private fb: FormBuilder
  ) {
    this.list = data.list;
    this.form = fb.group({
      'name': [data.item.name, Validators.required],
      'hasDate': [!!data.item.time],
      'time': [{value: data.item.time?.toISOString().slice(0,16), disabled: !data.item.time}]
    });

    this.form.get('hasDate')?.valueChanges.subscribe(val => {
      const timeControl = this.form.get('time');
      if (timeControl && !val) {
        timeControl.disable();
      } else if (timeControl) {
        timeControl.enable();
      }
    })

    if (data.item.time) {
      this.timezone = data.item.time.toISOString().slice(16);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  returnFormContent() {
    console.log(this.form.controls['time'].value, typeof(this.form.controls['time'].value))
    let time_val = this.form.controls['time'].value;
    if (this.timezone) {
      time_val += this.timezone;
    }

    this.dialogRef.close({
      'name': this.form.controls['name'].value,
      'time': this.form.controls['hasDate'].value ? time_val : null
    });
  }
}
