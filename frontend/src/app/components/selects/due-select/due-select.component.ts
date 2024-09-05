import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-due-select',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CommonModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DueSelectComponent),
      multi: true
    }
  ],
  templateUrl: './due-select.component.html',
  styleUrl: './due-select.component.scss'
})
export class DueSelectComponent implements ControlValueAccessor {

  due: string = '';
  
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled = false;

  constructor() { }

  writeValue(obj: string): void {
    this.due = obj;
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
}
