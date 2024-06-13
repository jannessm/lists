import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-share-list-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule
  ],
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
