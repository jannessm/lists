import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';
import flatpickr from 'flatpickr';
import { timePickerConfig } from '../../../../models/time-picker';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Subscription } from 'rxjs';
import { MyListsDocument } from '../../../mydb/types/lists';
import { MyItemDocument } from '../../../mydb/types/list-item';
import { DueOptionLabels, ReminderOptionLabels, getDueDate, getDueValue, getReminderDate, getReminderValue } from '../../selects/date-chip-select/options';
import { DateChipSelectComponent } from '../../selects/date-chip-select/date-chip-select.component';
import { DateInputSelectComponent } from '../../selects/date-input-select/date-input-select.component';

@Component({
  selector: 'app-update-item-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    DateChipSelectComponent,
    DateInputSelectComponent
  ],
  providers: [DatePipe],
  templateUrl: './update-item-sheet.component.html',
  styleUrls: ['./update-item-sheet.component.scss', '../styles.scss']
})
export class UpdateItemSheetComponent implements OnDestroy {
  form: FormGroup;
  list: MyListsDocument;

  dueOptions = DueOptionLabels.slice(0, 2);
  reminderOptions = ReminderOptionLabels;

  enableBottomSheetClose?: ReturnType<typeof setTimeout>;

  @ViewChild('autosize') autosize!: CdkTextareaAutosize;

  subscriptions: Subscription[] = [];

  constructor(
    public bottomSheetRef: MatBottomSheetRef<UpdateItemSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {list: MyListsDocument, item: MyItemDocument},
    private fb: FormBuilder
  ) {
    this.list = data.list;
    const due = !!data.item.due ? new Date(data.item.due) : null;
    const reminder = !!data.item.reminder ? new Date(data.item.reminder) : null;

    this.form = fb.group({
      'name': [data.item.name, Validators.required],
      'description': [data.item.description],
      'due-toggle': [!!data.item.due],
      'due': [due],
      'reminder': [getReminderValue(due, reminder)],
    });

    const formSub = this.form.get('due-toggle')?.valueChanges.subscribe(dueEnabled => {
      if (dueEnabled) {
        this.form.get('due')?.enable();

      } else {
        this.form.get('due')?.disable();
      }
    });
    
    if (formSub) {
      this.subscriptions.push(formSub);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  pickrOpened() {
    this.bottomSheetRef.disableClose = true;
  }

  pickrClosed() {
    if (this.enableBottomSheetClose) {
      clearTimeout(this.enableBottomSheetClose);
      this.enableBottomSheetClose = undefined;
    }
    
    if (this.bottomSheetRef.disableClose) {
      this.enableBottomSheetClose = setTimeout(() => {
        this.bottomSheetRef.disableClose = false;
        this.enableBottomSheetClose = undefined;
      }, 1000);
    }
  }

  getDueValue(due: Date | null) {
    return getDueValue(due);
  }
  getDueDate(option: string) {
    return getDueDate(option);
  }

  returnFormContent() {
    const patch = {};
    const dueToggle = !!this.form.get('due-toggle')?.value;
    const due = this.form.get('due')?.value;

    if (this.form.get('name')?.value != this.data.item.name) {
      Object.assign(patch, {
        name: this.form.get('name')?.value.trim()
      });
    }

    if (this.form.get('description')?.value != this.data.item.description &&
      !this.list.isShoppingList
    ) {
      Object.assign(patch, {
        description: this.form.get('description')?.value.trim()
      });
    }
    
    if (dueToggle && due && due != this.data.item.due &&
      !this.list.isShoppingList) {
      Object.assign(patch, {
        due
      });
    } else if (this.data.item.due != null && !dueToggle) {
      Object.assign(patch, {due: null});
    }

    if (dueToggle && due && this.form.get('reminder')?.value &&
      !this.list.isShoppingList) {
      const reminder = getReminderDate(
        new Date(due),
        this.form.get('reminder')?.value
      );

      if (reminder != this.data.item.reminder) {
        console.log(reminder);
        Object.assign(patch, {
          reminder: reminder
        });
      }
    } else if (this.data.item.reminder != null) {
      Object.assign(patch, {reminder: null});
    }

    this.bottomSheetRef.dismiss(patch);
  }
}
