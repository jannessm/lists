import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { List } from 'src/app/models/lists';

@Component({
  selector: 'app-add-sheet',
  templateUrl: './add-sheet.component.html',
  styleUrls: ['./add-sheet.component.scss']
})
export class AddSheetComponent {

  title: string = 'Liste Hinzufügen';
  form: FormGroup;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<AddSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: List,
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

  returnFormContent() {
    this.bottomSheetRef.dismiss({
      'name': this.form.controls['name'].value.trim(),
      'groceries': this.form.controls['groceries'].value
    });
  }

}
