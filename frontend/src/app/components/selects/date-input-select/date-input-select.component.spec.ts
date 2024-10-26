import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateInputSelectComponent } from './date-input-select.component';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('DateInputSelectComponent', () => {
  let component: DateInputSelectComponent;
  let fixture: ComponentFixture<DateInputSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideAnimations(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DateInputSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
