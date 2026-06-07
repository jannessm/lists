import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { DateTimePickerComponent } from '../date-time-picker/date-time-picker.component';

@Component({
    selector: 'app-date-input-select',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateInputSelectComponent),
            multi: true
        },
        DatePipe
    ],
    templateUrl: './date-input-select.component.html',
    styleUrl: './date-input-select.component.scss'
})
export class DateInputSelectComponent {
  @Input() options: [key: string, value: string][] = [];
  @Input() getChipValue: (date: Date | null) => string = () => '';
  @Input() getChipDate: (option: string) => string | null = () => null;

  @Output() pickrOpened = new EventEmitter<void>();
  @Output() pickrClosed = new EventEmitter<void>();

  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;

  chipOption: string = '';
  date: Date | null = null;
  pickrIsOpen = false;

  @ViewChild(DateTimePickerComponent) picker!: DateTimePickerComponent;

  constructor(private datePipe: DatePipe) {}

  get value(): string {
    return this.date ? this.date.toISOString() : '';
  }

  get dateLabel(): string {
    return this.datePipe.transform(this.date, 'short') || 'Datum wählen';
  }

  writeValue(date: string | null): void {
    if (!!date) {
      this.date = new Date(date);
    } else {
      this.date = new Date();
      this.date.setDate(this.date.getDate() + 1);
      this.date.setHours(9, 0, 0, 0);
      setTimeout(() => {
        this.onChange(this.value);
        this.onTouched();
      });
    }
    this.chipOption = this.getChipValue(this.date);
  }

  updateTime(): void {
    if (this.chipOption) {
      const date = this.getChipDate(this.chipOption) || '';
      this.date = new Date(date);
      this.onChange(this.value);
      this.onTouched();
    }
  }

  onDateChange(date: Date): void {
    this.date = date;
    this.chipOption = this.getChipValue(this.date);
    this.onChange(this.value);
    this.onTouched();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  openDatePicker(): void {
    if (!this.pickrIsOpen && this.picker) {
      if (this.date) {
        this.picker.setDate(this.date);
      }
      this.picker.open();
      this.pickrIsOpen = true;
      this.pickrOpened.emit();
    }
  }
}
