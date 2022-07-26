import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { List } from 'src/app/models/lists';

@Component({
  selector: 'app-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent {

  title: string = 'Liste Hinzufügen';
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: List,
    private fb: FormBuilder
  ) {
    if (data) {
      this.title = 'Liste Bearbeiten';
    }

    this.form = fb.group({
      'name': [this.data?.name || '', Validators.required],
      'groceries': [this.data?.groceries || false, Validators.required]
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
