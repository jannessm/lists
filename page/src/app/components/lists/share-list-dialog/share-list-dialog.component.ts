import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-share-list-dialog',
  templateUrl: './share-list-dialog.component.html',
  styleUrls: ['./share-list-dialog.component.scss']
})
export class ShareListDialogComponent {

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ShareListDialogComponent>,
    private fb: FormBuilder) {
    
    this.form = fb.group({
      'email': ['', Validators.required]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  returnFormContent() {
    this.dialogRef.close({
      'email': this.form.controls['email'].value
    });
  }
}
