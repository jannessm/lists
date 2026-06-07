import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { DateChipSelectComponent } from './date-chip-select.component';
import { DateTimePickerComponent } from '../date-time-picker/date-time-picker.component';
import { ComponentRef, DebugElement, LOCALE_ID } from '@angular/core';
import { By } from '@angular/platform-browser';
import { click } from '../../../../testing/helpers';
import { DatePipe } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';

const baseTime = new Date(2222, 2, 2);
const locale = 'en';

describe('DateChipSelectComponent', () => {
  let component: DateChipSelectComponent;
  let componentRef: ComponentRef<DateChipSelectComponent>;
  let componentEl: DebugElement;
  let fixture: ComponentFixture<DateChipSelectComponent>;

  const options: [key: string, value: string][] = [
    ['option1', 'Option 1'],
    ['option2', 'Option 2'],
    ['option3', 'Option 3'],
  ];

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(baseTime);

    await TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: locale },
        provideAnimations(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DateChipSelectComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentEl = fixture.debugElement;

    // Create a DateTimePickerComponent and wire it up
    const pickerFixture = TestBed.createComponent(DateTimePickerComponent);
    const pickerInstance = pickerFixture.componentInstance;
    component.picker = pickerInstance;
    pickerInstance.pickerClosed.subscribe(() => component.closePicker());
    pickerInstance.dateChange.subscribe((d: Date) => component.onDateChange(d));

    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('no default and no showOthers', () => {
    beforeEach(() => {
      componentRef.setInput('options', options);
      componentRef.setInput('showOthers', false);
      fixture.detectChanges();
    });

    it('should init picker', () => {
      expect(component.picker).toBeTruthy();
    });

    it('should render provided options', () => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      expect(chipOptions.length).toEqual(3);
      chipOptions.forEach((option: DebugElement, i) => {
        expect(option.nativeElement.textContent).toContain(options[i][1]);
      });
    });

    it('should have no default value', () => {
      expect(component.value).toEqual('');
    });

    it('should return correct value after select', fakeAsync(() => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      chipOptions[0].nativeElement.click();
      tick(100);
      expect(component.value).toEqual('option1');
    }));

    it('should allow empty selection', fakeAsync(() => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[0]);
      tick(100);
      expect(component.value).toEqual('option1');

      click(chipOptions[0]);
      tick(100);
      expect(component.value).toEqual('');
    }));

    it('should return correct value after selection change', fakeAsync(() => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[0]);
      tick(100);
      expect(component.value).toEqual('option1');

      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option2');

      click(chipOptions[2]);
      tick(100);
      expect(component.value).toEqual('option3');
    }));
  });

  describe('check default behavior', () => {
    beforeEach(() => {
      componentRef.setInput('options', options);
      componentRef.setInput('showOthers', false);
      componentRef.setInput('defaultOption', 'option1');
      fixture.detectChanges();
    });

    it('should have correct default value', fakeAsync(() => {
      expect(component.value).toEqual('option1');
    }));

    it('should return correct value after select', fakeAsync(() => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option2');
    }));

    it('should return default after deselect', fakeAsync(() => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option2');

      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option1');
    }));

    it('should return default after deselecting default option', fakeAsync(() => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[0]);
      tick(100);
      expect(component.value).toEqual('option1');
    }));
  });

  describe('check timepicker behavior', () => {
    const datePipe = new DatePipe(locale);

    beforeEach(() => {
      componentRef.setInput('options', options);
      componentRef.setInput('showOthers', true);
      fixture.detectChanges();
    });

    it('timepicker should be initialized', () => {
      expect(component.picker).toBeTruthy();
    });

    it('timepicker should open on select and preselect current time', fakeAsync(() => {
      expect(component.date).toBeNull();

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      expect(component.pickrIsOpen).toBeTrue();
      expect(component.picker!.isOpen).toBeTrue();
      expect(component.chipOption).toEqual('different');
    }));

    it('if timepicker is closed, text of different should be replaced', fakeAsync(() => {
      expect(component.date).toBeNull();

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      component.picker!.close();
      tick(100);
      fixture.detectChanges();

      expect(component.pickrIsOpen).toBeFalse();
      expect(component.picker!.isOpen).toBeFalse();
      expect(component.chipOption).toEqual('different');
      expect(component.date).toEqual(baseTime);
      expect(differentOption.nativeElement.innerText.trim()).toEqual(
        datePipe.transform(baseTime, 'short')
      );
    }));

    it('if timepicker date changes, component date should update immediately', fakeAsync(() => {
      expect(component.date).toBeNull();
      const newDate = new Date(2222, 0, 24);

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      fixture.detectChanges();
      tick(100);

      component.picker!.setDate(newDate, true);
      fixture.detectChanges();
      tick(100);

      expect(component.date).toEqual(newDate);
      expect(differentOption.nativeElement.innerText.trim()).toEqual(
        datePipe.transform(newDate, 'short')
      );
      expect(component.chipOption).toEqual('different');

      component.picker!.close();
      tick(100);
      fixture.detectChanges();

      expect(component.pickrIsOpen).toBeFalse();
      expect(component.picker!.isOpen).toBeFalse();
      expect(component.date).toEqual(newDate);
    }));

    // Bug A: closing picker without picking a date should NOT return "different"
    it('should not return "different" when picker is closed without selection (Bug A)', fakeAsync(() => {
      componentRef.setInput('defaultOption', 'option1');
      fixture.detectChanges();

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);
      expect(component.pickrIsOpen).toBeTrue();

      component.picker!.clear();
      component.picker!.close();
      tick(100);

      expect(component.value).not.toEqual('different');
      expect(component.value).toEqual('option1');
    }));

    // Bug B: writeValue before view is initialised should still apply the date
    it('should apply writeValue date to picker after init (Bug B)', fakeAsync(() => {
      const presetDate = new Date(2222, 5, 15);

      const fixture2 = TestBed.createComponent(DateChipSelectComponent);
      const comp2 = fixture2.componentInstance;
      const compRef2 = fixture2.componentRef;
      compRef2.setInput('options', options);
      compRef2.setInput('showOthers', true);

      comp2.writeValue(presetDate.toISOString());
      expect(comp2.date).toEqual(presetDate);
      expect(comp2.chipOption).toEqual('different');

      // Simulate the picker being attached after writeValue (as happens in real usage)
      const pickerFixture2 = TestBed.createComponent(DateTimePickerComponent);
      const pickerInstance2 = pickerFixture2.componentInstance;
      comp2.picker = pickerInstance2;

      fixture2.detectChanges();
      tick(100);

      expect(comp2.picker).toBeTruthy();
      expect(comp2.picker!.selectedDate).toBeTruthy();
      expect(comp2.picker!.selectedDate!.valueOf()).toEqual(presetDate.valueOf());
    }));

    // Bug C: switching away from "Andere" and back should clear stale selection
    it('should clear picker when switching away from "different" chip (Bug C)', fakeAsync(() => {
      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      const customDate = new Date(2222, 3, 10);
      component.picker!.setDate(customDate, true);
      component.picker!.close();
      tick(100);

      expect(component.date).toEqual(customDate);

      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[0]);
      tick(100);

      expect(component.picker!.selectedDate).toBeNull();
    }));

    // Bug D: onChange should fire before pickrClosed
    it('should emit onChange before pickrClosed (Bug D)', fakeAsync(() => {
      const callOrder: string[] = [];

      component.registerOnChange(() => callOrder.push('onChange'));
      component.pickrClosed.subscribe(() => callOrder.push('pickrClosed'));

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      component.picker!.close();
      tick(100);

      expect(callOrder.indexOf('onChange')).toBeLessThan(callOrder.indexOf('pickrClosed'));
    }));
  });
});
