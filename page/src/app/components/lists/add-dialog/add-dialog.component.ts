import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent {

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    private fb: FormBuilder
  ) {
    this.form = fb.group({
      'name': ['', Validators.required],
      'groceries': [false, Validators.required]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  returnFormContent() {
    this.dialogRef.close({
      'name': this.form.controls['name'].value,
      'groceries': this.form.controls['groceries'].value
    });
  }

}
