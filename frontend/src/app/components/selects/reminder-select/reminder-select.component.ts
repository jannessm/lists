import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { ReminderOptions, getReminderLabel } from './options';

import flatpickr from 'flatpickr';
import { timePickerConfig } from '../../../../models/time-picker';

@Component({
  selector: 'app-reminder-select',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CommonModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReminderSelectComponent),
      multi: true
    },
    DatePipe
  ],
  templateUrl: './reminder-select.component.html',
  styleUrl: './reminder-select.component.scss'
})
export class ReminderSelectComponent implements AfterViewInit {
  
  @Input()
  set showOthers(showOthers: boolean) {
    this._showOthers = showOthers;
  }
  get showOthers() {
    return this._showOthers;
  }
  private _showOthers = true;

  @Output() pickrOpened = new EventEmitter<void>();
  @Output() pickrClosed = new EventEmitter<void>();

  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;
  
  options = Object.values(ReminderOptions);
  
  reminder: string = '';
  reminderDate: Date | string = '';
  timezone?: string;
  flatpickr?: flatpickr.Instance;
  pickrIsOpen = false;
  @ViewChild('pickr') picker!: ElementRef;
  

  constructor(private datePipe: DatePipe) {
    this.timezone = new Date().toISOString().slice(16);
  }

  ngAfterViewInit(): void {
    this.initFlatpickr();
  }

  get value() {
    switch(this.reminder) {
      case 'different':
        if (typeof this.reminderDate === 'string') {
          this.reminderDate = new Date(this.reminderDate);
        }
        return this.reminderDate.toISOString().slice(0, 16) + this.timezone;
      default:
        return this.reminder;
    }
  }

  writeValue(reminder: string): void {
    if (this.showOthers) {
      let date: Date | string = ''
      
      try {
        date = new Date(reminder) || '';

        if (isNaN(date.getTime())) {
          date = '';
        }
      } catch { }

      this.reminderDate = date;
      if (!!this.reminderDate) {
        this.flatpickr?.setDate(this.reminderDate);
      }
    }

    this.reminder = reminder || '0 min';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  getLabel(option: ReminderOptions) {
    return getReminderLabel(option);
  }

  initFlatpickr() {
    this.flatpickr = flatpickr(this.picker.nativeElement, timePickerConfig) as flatpickr.Instance;
  
    this.flatpickr.config.onClose.push(() => {
      this.closePickr();
    });
  }

  openFlatpickr() {
    if (!this.pickrIsOpen && !!this.flatpickr) {
      this.flatpickr.open();
      this.pickrIsOpen = true;
      this.pickrOpened.emit();
    }
  }

  closePickr() {
    if (this.pickrIsOpen) {
      console.log(this.value);
      this.pickrIsOpen = false;
      this.pickrClosed.emit();
      this.onChange(this.value);
      this.onTouched();
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
}
