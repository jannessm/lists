import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateItemSheetComponent } from './update-item-sheet.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from '../../../services/auth/auth.service';
import { signal } from '@angular/core';
import { MockMyItemDocument, MockMyListsDocument, MockMyMeDocument } from '../../../services/auth/auth.service.mock';

describe('UpdateItemSheetComponent', () => {
  let component: UpdateItemSheetComponent;
  let fixture: ComponentFixture<UpdateItemSheetComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let bottomSheetMock: jasmine.SpyObj<MatBottomSheetRef>;
  let user = signal(new MockMyMeDocument());

  beforeEach(async () => {
    const AuthMock = jasmine.createSpyObj('AuthService', [], {me: user});
    const BottomSheetRef = jasmine.createSpyObj('BottomSheet', ['dismiss']);

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthMock },
        { provide: MatBottomSheetRef, useValue: BottomSheetRef },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: {
          list: signal(new MockMyListsDocument()),
          item: new MockMyItemDocument()
        } },
        provideAnimations(),
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    bottomSheetMock = TestBed.inject(MatBottomSheetRef) as jasmine.SpyObj<MatBottomSheetRef>;

    fixture = TestBed.createComponent(UpdateItemSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
