import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateChipSelectComponent } from './date-chip-select.component';

describe('DateChipSelectComponent', () => {
  let component: DateChipSelectComponent;
  let fixture: ComponentFixture<DateChipSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateChipSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateChipSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
