import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateChipSelectComponent } from './date-chip-select.component';

describe('DateChipSelectComponent', () => {
  let component: DateChipSelectComponent;
  let fixture: ComponentFixture<DateChipSelectComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
    });

    fixture = TestBed.createComponent(DateChipSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
