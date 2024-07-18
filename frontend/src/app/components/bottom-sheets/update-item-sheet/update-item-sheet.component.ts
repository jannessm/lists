import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';
import { Lists } from '../../../../models/rxdb/lists';
import { ListItem } from '../../../../models/rxdb/list-item';
import { RxDocument } from 'rxdb';
import flatpickr from 'flatpickr';
import { timePickerConfig } from '../../../../models/time-picker';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  selector: 'app-update-item-sheet',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule
  ],
  templateUrl: './update-item-sheet.component.html',
  styleUrls: ['./update-item-sheet.component.scss']
})
export class UpdateItemSheetComponent {
  form: FormGroup;
  list: RxDocument<Lists>;
  timezone: string | undefined;

  dueFlatpickr!: flatpickr.Instance;
  reminderFlatpickr!: flatpickr.Instance;
  duePickerOpen = false;
  reminderPickerOpen = false;

  enableBottomSheetClose?: ReturnType<typeof setTimeout>;

  @ViewChild('autosize') autosize!: CdkTextareaAutosize;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<UpdateItemSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {list: RxDocument<Lists>, item: RxDocument<ListItem>},
    private fb: FormBuilder
  ) {
    this.list = data.list;
    const due = data.item.due !== null ? new Date(data.item.due) : null;
    const reminder = data.item.reminder !== null ? new Date(data.item.reminder) : null;

    this.form = fb.group({
      'name': [data.item.name, Validators.required],
      'description': [data.item.description],
      'due-toggle': [!!data.item.due],
      'due': [{value: this.parseDateTime(due), disabled: !data.item.due}],
      'reminder-chips': [this.getReminderChipValue(due, reminder)],
      'reminder': [this.parseDateTime(reminder)],
    });

    this.form.get('due-toggle')?.valueChanges.subscribe(dueEnabled => {
      if (dueEnabled) {
        this.form.get('due')?.enable();

      } else {
        this.form.get('due')?.disable();
      }
    });

    if (due) {
      this.timezone = due.toISOString().slice(16);
    }
  }

  ngAfterViewInit() {
    this.reminderFlatpickr = flatpickr('#reminder-picker', timePickerConfig) as flatpickr.Instance;

    this.reminderFlatpickr.config.onClose.push(() => {
      this.closeReminderPicker();
    });

    if (this.form.get('reminder')?.value && this.data.item.reminder) {
      this.reminderFlatpickr.setDate(new Date(this.data.item.reminder));
    }

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

  openReminderPicker(event: any) {
    if (event.value === "different" && !this.reminderPickerOpen) {
      this.reminderFlatpickr.open();
      this.bottomSheetRef.disableClose = true;
      this.reminderPickerOpen = true;
    }
  }

  closeReminderPicker() {
    if (this.enableBottomSheetClose) {
      clearTimeout(this.enableBottomSheetClose);
      this.enableBottomSheetClose = undefined;
    }
    if (this.reminderPickerOpen) {
      this.reminderPickerOpen = false;
  
      this.enableBottomSheetClose = setTimeout(() => {
        this.bottomSheetRef.disableClose = false;
        this.enableBottomSheetClose = undefined;
      }, 1000);
    }
  }

  getReminderChipValue(due: Date | null, reminder: Date | null) {
    if (!due || !reminder) {
      return null;
    }
    
    const aDayBefore = new Date(due.valueOf());
    aDayBefore.setDate(due.getDate() - 1);
    if (reminder.valueOf() == aDayBefore.valueOf()) {
      return "1d";
    }

    const anHourBefore = new Date(due.valueOf());
    anHourBefore.setHours(due.getHours() - 1);
    if (reminder.valueOf() == anHourBefore.valueOf()) {
      return "1h";
    }

    const thirtyMinBefore = new Date(due.valueOf());
    thirtyMinBefore.setMinutes(due.getMinutes() - 30);
    if (reminder.valueOf() == thirtyMinBefore.valueOf()) {
      return "30min";
    }

    return "different";
  }

  parseDateTime(date: Date | null) {
    if (date) {
      // return date.toLocaleString();
      return date.toISOString().slice(0, 16);
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
    }

    if (dueToggle && due && this.form.get('reminder-chips')?.value &&
      !this.list.isShoppingList) {
      let reminder = new Date(due);
  
      switch (this.form.get('reminder-chips')?.value) {
        case '1d':
          reminder.setDate(reminder.getDate() - 1);
          break;
        case '1h':
          reminder.setHours(reminder.getHours() - 1);
          break;
        case '30min':
          reminder.setMinutes(reminder.getMinutes() - 30);
          break;
        case 'different':
          reminder = new Date(this.form.get('reminder')?.value + this.timezone);
          break;
      }

      if (reminder.toISOString() != this.data.item.reminder) {
        Object.assign(patch, {
          reminder: reminder.toISOString()
        });
      }
    }

    this.bottomSheetRef.dismiss(patch);
  }
}
