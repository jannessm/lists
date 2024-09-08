import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { CommonModule, DatePipe } from '@angular/common';

import flatpickr from 'flatpickr';
import { timePickerConfig } from '../../../../models/time-picker';

@Component({
  selector: 'app-date-chip-select',
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
      useExisting: forwardRef(() => DateChipSelectComponent),
      multi: true
    },
    DatePipe
  ],
  templateUrl: './date-chip-select.component.html',
  styleUrl: './date-chip-select.component.scss'
})
export class DateChipSelectComponent implements AfterViewInit {
  
  @Input()
  set showOthers(showOthers: boolean) {
    this._showOthers = showOthers;
  }
  get showOthers() {
    return this._showOthers;
  }
  private _showOthers = true;
  @Input() options: [key: string, value: string][] = [];

  @Output() pickrOpened = new EventEmitter<void>();
  @Output() pickrClosed = new EventEmitter<void>();

  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;

  chipOption: string = '';
  date: Date | string = '';
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

  get value(): string {
    switch(this.chipOption) {
      case 'different':
        if (typeof this.date === 'string') {
          this.date = new Date(this.date);
        }
        return this.date.toISOString().slice(0, 16) + this.timezone;
      default:
        return this.chipOption;
    }
  }

  writeValue(chipOption: string): void {
    if (this.showOthers) {
      let date: Date | string = ''
      
      try {
        date = new Date(chipOption) || '';

        if (isNaN(date.valueOf())) {
          date = '';
        }
      } catch { }

      this.date = date;
      
      if (!!this.date) {
        this.flatpickr?.setDate(this.date);
        chipOption = "different"
      }
    }

    this.chipOption = chipOption || '0 min';
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