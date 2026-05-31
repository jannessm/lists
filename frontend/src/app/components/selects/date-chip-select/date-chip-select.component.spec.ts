import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';

import { DateChipSelectComponent } from './date-chip-select.component';
import { ComponentRef, DebugElement, LOCALE_ID, NgZone } from '@angular/core';
import { By } from '@angular/platform-browser';
import { click } from '../../../../testing/helpers';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { keyframes } from '@angular/animations';

const baseTime = new Date(2222,2,2);
const locale = 'en'

describe('DateChipSelectComponent', () => {
  let component: DateChipSelectComponent;
  let componentRef: ComponentRef<DateChipSelectComponent>;
  let componentEl: DebugElement;
  let fixture: ComponentFixture<DateChipSelectComponent>;

  const options: [key: string, value: string][] = [
    ['option1', 'Option 1'],
    ['option2', 'Option 2'],
    ['option3', 'Option 3'],
  ]

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(baseTime);

    await TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: locale }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DateChipSelectComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentEl = fixture.debugElement;
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

    it('should init timerpicker anyways', () => {
      expect(component.flatpickr).toBeTruthy();
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
      expect(component.value).toEqual('');

      // click on option
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      chipOptions[0].nativeElement.click();
      tick(100);
      expect(component.value).toEqual('option1');

    }));

    it('should allow empty selection', fakeAsync(() => {
      expect(component.value).toEqual('');

      // click an option
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[0]);
      tick(100);
      expect(component.value).toEqual('option1');

      // deselect option
      click(chipOptions[0]);
      tick(100);
      expect(component.value).toEqual('');

    }));
    

    it('should return correct value after selection change', fakeAsync(() => {
      expect(component.value).toEqual('');

      // click on option
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
    
    it('should render provided options', () => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      expect(chipOptions.length).toEqual(3);
      chipOptions.forEach((option: DebugElement, i) => {
        expect(option.nativeElement.textContent).toContain(options[i][1]);
      });
    });

    it('should have correct default value', fakeAsync(() => {
      expect(component.value).toEqual('option1');
    }));

    it('should return correct value after select', fakeAsync(() => {
      expect(component.value).toEqual('option1');

      // click on option
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option2');

    }));

    it('should return default after deselect', fakeAsync(() => {
      expect(component.value).toEqual('option1');

      // click an option
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option2');

      // deselect option
      click(chipOptions[1]);
      tick(100);
      expect(component.value).toEqual('option1');
    }));

    it('should return default after deselecting default option', fakeAsync(() => {
      expect(component.value).toEqual('option1');

      // click an option
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
      expect(component.flatpickr).toBeTruthy();
    });

    it('timepicker should open on select and preselect current time', fakeAsync(() => {
      expect(component.date).toEqual('');

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);
      expect(component.pickrIsOpen).toBeTrue();
      expect(component.flatpickr?.isOpen).toBeTrue();
      expect(component.flatpickr?.selectedDates[0]).toEqual(baseTime);
      expect(component.chipOption).toEqual('different');
    }));

    it('if timepicker is closed, text of different should be replaced', fakeAsync(() => {
      expect(component.date).toEqual('');

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      component.flatpickr?.close();
      tick(100);
      fixture.detectChanges();

      expect(component.pickrIsOpen).toBeFalse();
      expect(component.flatpickr?.isOpen).toBeFalse();
      expect(component.chipOption).toEqual('different');
      expect(component.date).toEqual(baseTime);
      expect(differentOption.nativeElement.innerText).toEqual(
        datePipe.transform(baseTime, 'short')
      );
    }));

    it('if timepicker is closed, changes in timepicker date should update component', fakeAsync(() => {
      expect(component.date).toEqual('');
      const newDate = new Date(2222,0,24);

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      fixture.detectChanges();
      tick(100);
      
      component.flatpickr?.setDate(newDate, true);
      fixture.detectChanges();
      tick(100);
      expect(component.date).toEqual(newDate);
      expect(differentOption.nativeElement.innerText).toEqual(
        datePipe.transform(newDate, 'short')
      );
      expect(component.chipOption).toEqual('different');

      component.flatpickr?.close();
      tick(100);
      fixture.detectChanges();
  
      expect(component.pickrIsOpen).toBeFalse();
      expect(component.flatpickr?.isOpen).toBeFalse();
      expect(component.date).toEqual(newDate);
      expect(differentOption.nativeElement.innerText).toEqual(
        datePipe.transform(newDate, 'short')
      );
      expect(component.chipOption).toEqual('different');
    }));

    // Bug A: closing flatpickr without picking a date should NOT return "different"
    it('should not return "different" when flatpickr is closed without selection (Bug A)', fakeAsync(() => {
      componentRef.setInput('defaultOption', 'option1');
      fixture.detectChanges();

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);
      expect(component.pickrIsOpen).toBeTrue();

      // clear selected dates to simulate closing without picking
      component.flatpickr?.clear();
      component.flatpickr?.close();
      tick(100);

      // value should fall back to default, not return literal "different"
      expect(component.value).not.toEqual('different');
      expect(component.value).toEqual('option1');
    }));

    // Bug B: writeValue before flatpickr is initialised should still apply the date
    it('should apply writeValue date to flatpickr after init (Bug B)', fakeAsync(() => {
      const presetDate = new Date(2222, 5, 15);

      // Simulate what Angular forms do: writeValue is called during init,
      // potentially before ngAfterViewInit.
      // We recreate the component to test this flow.
      const fixture2 = TestBed.createComponent(DateChipSelectComponent);
      const comp2 = fixture2.componentInstance;
      const compRef2 = fixture2.componentRef;
      compRef2.setInput('options', options);
      compRef2.setInput('showOthers', true);

      // writeValue before first detectChanges (which triggers ngAfterViewInit)
      comp2.writeValue(presetDate.toISOString());
      expect(comp2.date).toEqual(presetDate);
      expect(comp2.chipOption).toEqual('different');

      // Now trigger ngAfterViewInit via detectChanges
      fixture2.detectChanges();
      tick(100);

      // flatpickr should now have the date set
      expect(comp2.flatpickr).toBeTruthy();
      expect(comp2.flatpickr?.selectedDates.length).toBeGreaterThan(0);
      expect(comp2.flatpickr?.selectedDates[0].valueOf()).toEqual(presetDate.valueOf());
    }));

    // Bug C: switching away from "Andere" and back should clear stale flatpickr selection
    it('should clear flatpickr when switching away from "different" chip (Bug C)', fakeAsync(() => {
      // Pick a custom date via "Andere"
      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      const customDate = new Date(2222, 3, 10);
      component.flatpickr?.setDate(customDate, true);
      component.flatpickr?.close();
      tick(100);

      expect(component.date).toEqual(customDate);

      // Switch to option1
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option button'));
      click(chipOptions[0]);
      tick(100);

      // flatpickr internal selection should be cleared
      expect(component.flatpickr?.selectedDates.length).toEqual(0);
    }));

    // Bug D: onChange should fire before pickrClosed
    it('should emit onChange before pickrClosed (Bug D)', fakeAsync(() => {
      const callOrder: string[] = [];

      component.registerOnChange(() => callOrder.push('onChange'));
      component.pickrClosed.subscribe(() => callOrder.push('pickrClosed'));

      const differentOption = componentEl.query(By.css('mat-chip-option[value=different] button'));
      click(differentOption);
      tick(100);

      component.flatpickr?.close();
      tick(100);

      expect(callOrder.indexOf('onChange')).toBeLessThan(callOrder.indexOf('pickrClosed'));
    }));
  });
});
