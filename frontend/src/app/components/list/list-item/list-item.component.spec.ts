import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItemComponent } from './list-item.component';
import { signal, WritableSignal } from '@angular/core';
import { MockMyItemDocument, MockMyListsDocument, MockMyMeDocument } from '../../../services/auth/auth.service.mock';
import { MyListsDocument } from '../../../mydb/types/lists';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MyMeDocument } from '../../../mydb/types/me';
import { MyItemDocument } from '../../../mydb/types/list-item';
import { UsersService } from '../../../services/users/users.service';
import { UsersServiceSpy } from '../../../services/users/users.service.mock';
import { MatBottomSheetMock } from '../../../../testing/mocks';

describe('ListItemComponent', () => {
  let component: ListItemComponent;
  let fixture: ComponentFixture<ListItemComponent>;

  let usersMock: jasmine.SpyObj<UsersService>;
  let bottomSheetMock: jasmine.SpyObj<MatBottomSheet>;
  let bottomSheetRefMock: jasmine.SpyObj<MatBottomSheetRef>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: UsersService, useClass: UsersServiceSpy },
        { provide: MatBottomSheet, useClass: MatBottomSheetMock },
        provideAnimations(),
      ]
    }).compileComponents();

    usersMock = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    bottomSheetMock = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;
    bottomSheetMock.open.and.returnValue(bottomSheetRefMock);

    fixture = TestBed.createComponent(ListItemComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.list = signal(new MockMyListsDocument()) as unknown as WritableSignal<MyListsDocument>;
    component.me = signal(new MockMyMeDocument()) as unknown as WritableSignal<MyMeDocument>;
    component.item = (new MockMyItemDocument()) as unknown as MyItemDocument;
    
    fixture.detectChanges();
  
    expect(component).toBeTruthy();
  });
});
