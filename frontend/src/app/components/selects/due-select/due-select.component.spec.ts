import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DueSelectComponent } from './due-select.component';

describe('DueSelectComponent', () => {
  let component: DueSelectComponent;
  let fixture: ComponentFixture<DueSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DueSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DueSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
