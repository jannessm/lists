import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSheetComponent } from './confirm-sheet.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('ConfirmSheetComponent', () => {
  let component: ConfirmSheetComponent;
  let fixture: ComponentFixture<ConfirmSheetComponent>;

  let bottomSheetMock: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(async () => {
    const BottomSheetRef = jasmine.createSpyObj('BottomSheet', ['dismiss']);
  
    await TestBed.configureTestingModule({
      providers: [
        { provide: MatBottomSheetRef, useValue: BottomSheetRef },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: undefined },
        provideAnimations(),
      ]
    }).compileComponents();

    bottomSheetMock = TestBed.inject(MatBottomSheetRef) as jasmine.SpyObj<MatBottomSheetRef>;

    fixture = TestBed.createComponent(ConfirmSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
