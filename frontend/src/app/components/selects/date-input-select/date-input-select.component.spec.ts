import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateInputSelectComponent } from './date-input-select.component';

describe('DateInputSelectComponent', () => {
  let component: DateInputSelectComponent;
  let fixture: ComponentFixture<DateInputSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateInputSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
