import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-share-list-dialog',
  templateUrl: './share-list-dialog.component.html',
  styleUrls: ['./share-list-dialog.component.scss']
})
export class ShareListDialogComponent {

  form: FormGroup;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ShareListDialogComponent>,
    private fb: FormBuilder) {
    
    this.form = fb.group({
      'email': ['', Validators.required]
    });
  }

  returnFormContent() {
    this.bottomSheetRef.dismiss({
      'email': this.form.controls['email'].value
    });
  }
}
