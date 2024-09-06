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
import { ReminderOptionLabels, getReminderDate, getReminderValue } from '../../selects/date-chip-select/options';
import { DateChipSelectComponent } from '../../selects/date-chip-select/date-chip-select.component';

@Component({
  selector: 'app-update-item-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    DateChipSelectComponent
  ],
  providers: [DatePipe],
  templateUrl: './update-item-sheet.component.html',
  styleUrls: ['./update-item-sheet.component.scss', '../styles.scss']
})
export class UpdateItemSheetComponent implements OnDestroy {
  form: FormGroup;
  list: MyListsDocument;
  timezone: string;

  dueFlatpickr!: flatpickr.Instance;
  duePickerOpen = false;

  reminderOptions = ReminderOptionLabels;

  enableBottomSheetClose?: ReturnType<typeof setTimeout>;

  @ViewChild('autosize') autosize!: CdkTextareaAutosize;

  subscriptions: Subscription[] = [];

  constructor(
    public bottomSheetRef: MatBottomSheetRef<UpdateItemSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {list: MyListsDocument, item: MyItemDocument},
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.list = data.list;
    const due = !!data.item.due ? new Date(data.item.due) : null;
    const reminder = !!data.item.reminder ? new Date(data.item.reminder) : null;

    this.form = fb.group({
      'name': [data.item.name, Validators.required],
      'description': [data.item.description],
      'due-toggle': [!!data.item.due],
      'due': [{value: this.parseDateTime(due), disabled: !data.item.due}],
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

    this.timezone = new Date('2020-01-01T10:00').toISOString().slice(16);
  }

  ngAfterViewInit() {
    this.dueFlatpickr = flatpickr('#due-picker', timePickerConfig) as flatpickr.Instance;

    this.dueFlatpickr.config.onChange.push(val => {  
      if (val.length > 0 && !!this.form.get('due')) {
        this.form.get('due')?.setValue(this.parseDateTime(val[0]));
      } else {
        this.form.get('due')?.reset();
      }
    });
    
    this.dueFlatpickr.config.onClose.push(() => {
      this.closePicker();
    });

    
    if (this.form.get('due')?.value && this.data.item.due) {
      this.dueFlatpickr.setDate(new Date(this.data.item.due));
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openPicker() {
    if (!this.duePickerOpen) {
      this.dueFlatpickr.open();
      this.bottomSheetRef.disableClose = true;
      this.duePickerOpen = true;
    }
  }

  closePicker() {
    if (this.enableBottomSheetClose) {
      clearTimeout(this.enableBottomSheetClose);
      this.enableBottomSheetClose = undefined;
    }
    if (this.duePickerOpen) {
      this.duePickerOpen = false;
  
      this.enableBottomSheetClose = setTimeout(() => {
        this.bottomSheetRef.disableClose = false;
        this.enableBottomSheetClose = undefined;
      }, 1000);
    }
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

  parseDateTime(date: Date | null) {
    if (date) {
      return this.datePipe.transform(
        date.toISOString().slice(0, 16),
        'short'
      );
    }
    return '';
  }

  parseFormDateTime(_date: string) {
    const date = new Date(_date + this.timezone);
    return date.toISOString();
  }

  returnFormContent() {
    const patch = {};
    const dueToggle = !!this.form.get('due-toggle')?.value;
    const due = this.form.get('due')?.value + this.timezone;

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
