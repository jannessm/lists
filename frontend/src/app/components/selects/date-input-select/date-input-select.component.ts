import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { timePickerConfig } from '../../../../models/time-picker';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-date-input-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
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
export class DateInputSelectComponent implements AfterViewInit {
  @Input() options: [key: string, value: string][] = [];
  @Input() getChipValue: (date: Date | null) => string = () => '';
  @Input() getChipDate: (option: string) => string | null = () => null;

  @Output() pickrOpened = new EventEmitter<void>();
  @Output() pickrClosed = new EventEmitter<void>();

  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;

  chipOption: string = '';
  dateString: string = '';
  date: Date | null = null;
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
    if (this.date) {
      return this.date.toISOString();
    } else {
      return '';
    }
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
    this.dateString = this.getDateString(this.date);
    this.chipOption = this.getChipValue(this.date);
  }

  updateTime() {
    if (this.chipOption) {
      const date = this.getChipDate(this.chipOption) || '';
      this.date = new Date(date);
      
      if (!!date) {
        this.dateString = this.getDateString(this.date);
      }

      this.onChange(this.value);
      this.onTouched();
    }
  }

  updateChips() {
    if (this.flatpickr) {
      this.date = this.flatpickr.selectedDates[0];
      this.chipOption = this.getChipValue(this.date);
      
      this.onChange(this.value);
      this.onTouched();
    }
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
    const config = JSON.parse(JSON.stringify(timePickerConfig));
    Object.assign(config, {
      formatDate: (date: Date) => this.getDateString(date)
    });

    this.flatpickr = flatpickr(this.picker.nativeElement, config) as flatpickr.Instance;
  
    this.flatpickr.config.onClose.push(() => {
      this.closePickr();
    });
    this.flatpickr.config.onChange.push(() => {
      this.updateChips();
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
  
  getDateString(date: Date) {
    return this.datePipe.transform(date, 'short') || '';
  }
}
