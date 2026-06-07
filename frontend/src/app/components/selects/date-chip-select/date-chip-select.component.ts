import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { MatChipListboxChange } from '@angular/material/chips';
import { DateTimePickerComponent } from '../date-time-picker/date-time-picker.component';

@Component({
    selector: 'app-date-chip-select',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        CommonModule,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateChipSelectComponent),
            multi: true
        },
        DatePipe
    ],
    templateUrl: './date-chip-select.component.html',
    styleUrl: './date-chip-select.component.scss'
})
export class DateChipSelectComponent {

  @Input() showOthers = true;
  @Input() options: [key: string, value: string][] = [];
  @Input()
  set defaultOption(defaultOption: string) {
    this._defaultOption = defaultOption;
    if (!this.chipOption) {
      this.chipOption = defaultOption;
    }
  }
  get defaultOption(): string | undefined {
    return this._defaultOption;
  }
  private _defaultOption: string | undefined;

  private _picker?: DateTimePickerComponent;
  private _pendingDate?: Date;

  @Input()
  set picker(p: DateTimePickerComponent | undefined) {
    this._picker = p;
    if (p && this._pendingDate) {
      p.setDate(this._pendingDate);
      this._pendingDate = undefined;
    }
  }
  get picker(): DateTimePickerComponent | undefined {
    return this._picker;
  }

  date: Date | null = null;

  @Output() pickrOpened = new EventEmitter<void>();
  @Output() pickrClosed = new EventEmitter<void>();

  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;

  chipOption: string = '';
  pickrIsOpen = false;

  constructor(private datePipe: DatePipe) { }

  get value(): string {
    if (this.chipOption === 'different') {
      const d = this.date;
      if (d instanceof Date && !isNaN(d.valueOf())) return d.toISOString();
      // picker was opened but closed without a selection — fall back to default
      this.chipOption = this.defaultOption || '';
      return this.chipOption;
    }
    return this.chipOption;
  }

  writeValue(chipOption: string): void {
    if (this.showOthers) {
      let date: Date | null = null;

      try {
        const parsed = new Date(chipOption);
        date = isNaN(parsed.valueOf()) ? null : parsed;
      } catch { }

      this.date = date;

      if (this.date) {
        if (this.picker) {
          this.picker.setDate(this.date);
        } else {
          this._pendingDate = this.date;
        }
        chipOption = 'different';
      }
    }

    this.chipOption = chipOption;
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

  changeOption(event: MatChipListboxChange) {
    setTimeout(() => {
      if (!event.value) {
        this.chipOption = this.defaultOption || '';
        this.date = null;
        this.picker?.clear();
        this.onChange(this.value);
        this.onTouched();
      } else if (
        event.value === 'different' &&
        this.showOthers &&
        !this.pickrIsOpen
      ) {
        this.openPicker();
      } else {
        this.date = null;
        this.picker?.clear();
        this.onChange(this.value);
        this.onTouched();
      }
    }, 10);
  }

  openPicker(): void {
    if (!this.pickrIsOpen && this.picker) {
      this.picker.open();
      this.pickrIsOpen = true;
      this.pickrOpened.emit();
    }
  }

  closePicker(): void {
    if (this.pickrIsOpen) {
      this.pickrIsOpen = false;
      const picked = this.picker?.selectedDate ?? null;
      if (!picked) {
        this.chipOption = this.defaultOption || '';
        this.date = null;
      } else {
        this.date = picked;
      }
      this.onChange(this.value);
      this.onTouched();
      this.pickrClosed.emit();
    }
  }

  onDateChange(date: Date): void {
    this.date = date;
    this.onChange(this.value);
    this.onTouched();
  }

  parseDateTime(date: Date | null): string | null {
    if (date) {
      return this.datePipe.transform(
        date.toISOString().slice(0, 16),
        'short'
      );
    }
    return '';
  }
}
