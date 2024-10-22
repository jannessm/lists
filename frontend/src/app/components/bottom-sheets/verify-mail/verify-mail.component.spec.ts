import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyMailComponent } from './verify-mail.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

describe('VerifyMailComponent', () => {
  let component: VerifyMailComponent;
  let fixture: ComponentFixture<VerifyMailComponent>;

  let bottomSheetMock: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(async () => {
    const BottomSheetRef = jasmine.createSpyObj('BottomSheet', ['dismiss']);
    TestBed.configureTestingModule({
      providers: [
        { provide: MatBottomSheetRef, useValue: BottomSheetRef }
      ]
    });

    bottomSheetMock = TestBed.inject(MatBottomSheetRef) as jasmine.SpyObj<MatBottomSheetRef>;

    fixture = TestBed.createComponent(VerifyMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
