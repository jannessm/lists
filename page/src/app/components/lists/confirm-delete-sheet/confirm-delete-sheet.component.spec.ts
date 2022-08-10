import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteSheetComponent } from './confirm-delete-sheet.component';

describe('ConfirmDeleteSheetComponent', () => {
  let component: ConfirmDeleteSheetComponent;
  let fixture: ComponentFixture<ConfirmDeleteSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmDeleteSheetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
