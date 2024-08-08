import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { RxListsDocument } from '../../../mydb/types/lists';

@Component({
  selector: 'app-add-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule
  ],
  templateUrl: './add-sheet.component.html',
  styleUrls: ['./add-sheet.component.scss', '../styles.scss']
})
export class AddSheetComponent {

  title: string = 'Liste Hinzufügen';
  form: FormGroup;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<AddSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: RxListsDocument,
    private fb: FormBuilder
  ) {
    if (data) {
      this.title = 'Liste Bearbeiten';
    }

    this.form = fb.group({
      'name': [this.data?.name || '', Validators.required],
      'isShoppingList': [this.data?.isShoppingList || false, Validators.required]
    });

  }

  returnFormContent() {
    this.bottomSheetRef.dismiss({
      'name': this.form.controls['name'].value.trim(),
      'isShoppingList': this.form.controls['isShoppingList'].value
    });
  }

}
