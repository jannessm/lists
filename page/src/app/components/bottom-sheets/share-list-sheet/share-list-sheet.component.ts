import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-share-list-sheet',
  templateUrl: './share-list-sheet.component.html',
  styleUrls: ['./share-list-sheet.component.scss']
})
export class ShareListSheetComponent {

  form: FormGroup;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ShareListSheetComponent>,
    private fb: FormBuilder) {
    
    this.form = fb.group({
      'email': ['', Validators.required]
    });
  }

  returnFormContent() {
    this.bottomSheetRef.dismiss({
      'email': this.form.controls['email'].value.toLowerCase().trim()
    });
  }
}
