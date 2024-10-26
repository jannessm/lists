import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSheetComponent } from './add-sheet.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('AddSheetComponent', () => {
  let component: AddSheetComponent;
  let fixture: ComponentFixture<AddSheetComponent>;

  let bottomSheetMock: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(async () => {
    const BottomSheetRef = jasmine.createSpyObj('BottomSheet', ['dismiss']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatBottomSheetRef, useValue: BottomSheetRef },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: undefined },
        provideAnimations(),
      ]
    });

    bottomSheetMock = TestBed.inject(MatBottomSheetRef) as jasmine.SpyObj<MatBottomSheetRef>;

    fixture = TestBed.createComponent(AddSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
