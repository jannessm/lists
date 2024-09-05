import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderSelectComponent } from './reminder-select.component';

describe('ReminderSelectComponent', () => {
  let component: ReminderSelectComponent;
  let fixture: ComponentFixture<ReminderSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
