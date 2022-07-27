import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ListItem } from 'src/app/models/lists';

@Component({
  selector: 'app-update-item-dialog',
  templateUrl: './update-item-dialog.component.html',
  styleUrls: ['./update-item-dialog.component.scss']
})
export class UpdateItemDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UpdateItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ListItem,
    private fb: FormBuilder
  ) {
    this.form = fb.group({
      'name': [data.name, Validators.required],
      'time': [data.time]
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
