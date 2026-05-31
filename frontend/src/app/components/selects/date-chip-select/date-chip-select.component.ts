import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { CommonModule, DatePipe } from '@angular/common';

import flatpickr from 'flatpickr';
import { getTimePickerConfig } from '../../../../models/time-picker';
import { MatChipListboxChange, MatChipSelectionChange } from '@angular/material/chips';

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
export class DateChipSelectComponent implements AfterViewInit {

  
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
  
  
  @Output() pickrOpened = new EventEmitter<void>();
  @Output() pickrClosed = new EventEmitter<Event>();
  
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;
  
  chipOption: string = '';
  date: Date | string = '';
  flatpickr?: flatpickr.Instance;
  pickrIsOpen = false;
  @ViewChild('pickr') picker!: ElementRef;
  
  constructor(private datePipe: DatePipe) { }

  ngAfterViewInit(): void {
    this.initFlatpickr();
    // re-apply a date stored by writeValue() before flatpickr was ready
    if (this.date) {
      this.flatpickr?.setDate(this.date);
    }
  }

  get value(): string {
    if (this.chipOption === 'different') {
      const d = this.date;
      if (d instanceof Date && !isNaN(d.valueOf())) return d.toISOString();
      if (typeof d === 'string' && !!d) {
        this.date = new Date(d);
        return (this.date as Date).toISOString();
      }
      // picker was opened but closed without a selection — fall back to default
      this.chipOption = this.defaultOption || '';
      return this.chipOption;
    }
    return this.chipOption;
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

    this.chipOption = chipOption;
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

  changeOption(event: MatChipListboxChange) {
    setTimeout(() => {
      if (!event.value) {
        this.chipOption = this.defaultOption || '';
        this.date = '';
        this.flatpickr?.clear();
        this.onChange(this.value);
        this.onTouched();
      } else if (
        event.value === 'different' &&
        this.showOthers &&
        !this.pickrIsOpen
      ) {
        this.openFlatpickr();
      } else {
        this.date = '';
        this.flatpickr?.clear();
        this.onChange(this.value);
        this.onTouched();
      }
    }, 10);
  }

  initFlatpickr() {
    this.flatpickr = flatpickr(this.picker.nativeElement, getTimePickerConfig()) as flatpickr.Instance;
  
    this.flatpickr.config.onClose.push(() => {
      this.closePickr();
    });
    this.flatpickr.config.onChange.push(() => {
      if (this.flatpickr) {
        this.date = this.flatpickr.selectedDates[0];
      }
    })
  }

  openFlatpickr() {
    if (!this.pickrIsOpen && !!this.flatpickr) {
      this.flatpickr.open();
      this.pickrIsOpen = true;
      this.pickrOpened.emit();
    }
  }

  closePickr() {
    if (this.pickrIsOpen && this.flatpickr) {
      this.pickrIsOpen = false;
      const picked = this.flatpickr.selectedDates[0];
      if (!picked) {
        // user dismissed without picking — revert to default
        this.chipOption = this.defaultOption || '';
        this.date = '';
      } else {
        this.date = picked;
      }
      this.onChange(this.value);
      this.onTouched();
      this.pickrClosed.emit();
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
