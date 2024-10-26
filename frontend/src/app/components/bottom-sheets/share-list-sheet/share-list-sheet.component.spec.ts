import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareListSheetComponent } from './share-list-sheet.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AuthService } from '../../../services/auth/auth.service';
import { DataService } from '../../../services/data/data.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MockMyListsDocument, MockMyMeDocument } from '../../../services/auth/auth.service.mock';

describe('ShareListSheetComponent', () => {
  let component: ShareListSheetComponent;
  let fixture: ComponentFixture<ShareListSheetComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let dataMock: jasmine.SpyObj<DataService>;
  let bottomSheetRefMock: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(async () => {
    const AuthMock = jasmine.createSpyObj('AuthService', [], {
      me: signal(new MockMyMeDocument())
    });
    const DataMock = jasmine.createSpyObj('DataService', [], {db: {items: {find: () => {return {
      remove: () => {},
      patch: () => {}
    }}}}});
    bottomSheetRefMock = jasmine.createSpyObj('BottomSheetRef', ['dismiss']);

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthMock },
        { provide: DataService, useValue: DataMock },
        { provide: MatBottomSheetRef, useValue: bottomSheetRefMock},
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: {
          lists: signal(new MockMyListsDocument()),
          users: signal(undefined),
          isAdmin: false,
        } },
        provideAnimations(),
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dataMock = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;

    fixture = TestBed.createComponent(ShareListSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
