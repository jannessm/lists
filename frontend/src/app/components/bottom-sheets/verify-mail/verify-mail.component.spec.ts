import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyMailComponent } from './verify-mail.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatBottomSheetRefMock } from '../../../../testing/mocks';

describe('VerifyMailComponent', () => {
  let component: VerifyMailComponent;
  let fixture: ComponentFixture<VerifyMailComponent>;

  let bottomSheetMock: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: MatBottomSheetRef, useValue: MatBottomSheetRefMock }
      ]
    }).compileComponents();

    bottomSheetMock = TestBed.inject(MatBottomSheetRef) as jasmine.SpyObj<MatBottomSheetRef>;

    fixture = TestBed.createComponent(VerifyMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
