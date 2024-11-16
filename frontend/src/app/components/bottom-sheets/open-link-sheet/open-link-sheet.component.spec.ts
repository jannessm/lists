import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenLinkSheetComponent } from './open-link-sheet.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatBottomSheetRefMock } from '../../../../testing/mocks';

describe('OpenLinkSheetComponent', () => {
  let component: OpenLinkSheetComponent;
  let fixture: ComponentFixture<OpenLinkSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenLinkSheetComponent],
      providers: [
        { provide: MatBottomSheetRef, useValue: MatBottomSheetRefMock },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: ['link1', 'link2'] },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenLinkSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
