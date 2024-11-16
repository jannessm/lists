import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateChipSelectComponent } from './date-chip-select.component';
import { ComponentRef, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { click } from '../../../../testing/helpers';

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
    await TestBed.configureTestingModule({
    }).compileComponents();

    fixture = TestBed.createComponent(DateChipSelectComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentEl = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create and init flatpickr', () => {
    expect(componentRef.instance).toBeTruthy();
    expect(component.flatpickr).toBeTruthy();
  });

  describe('no default and no showOthers', () => {
    beforeEach(() => {
      componentRef.setInput('options', options);
      componentRef.setInput('showOthers', false);

      fixture.detectChanges();
    });
    
    it('should render provided options', () => {
      const chipOptions = componentEl.queryAll(By.css('mat-chip-option'));
      expect(chipOptions.length).toEqual(3);
      chipOptions.forEach((option: DebugElement, i) => {
        expect(option.nativeElement.textContent).toContain(options[i][1]);
      });
    });

    it('should have no default value', () => {
      expect(component.value).toEqual('');
    });

    // it('should return correct value after select', () => {
    //   expect(component.value).toEqual('');

    //   // click on option
    //   const chipOptions = componentEl.queryAll(By.css('mat-chip-option'));
    //   click(chipOptions[0]);

    //   fixture.detectChanges();

    //   expect(component.chipOption).toEqual('option1');
    // });

    // it('should allow empty selection', () => {
    //   const chipOptions = componentEl.queryAll(By.css('mat-chip-option'));
    // });

    

    // it('should return correct value after selection change', () => {

    // });
  })
});
