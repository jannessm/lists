import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHeaderComponent } from './list-header.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AuthService } from '../../../services/auth/auth.service';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal, WritableSignal } from '@angular/core';
import { DataService } from '../../../services/data/data.service';
import { MockMyListsDocument } from '../../../services/auth/auth.service.mock';
import { MyListsDatabase } from '../../../mydb/types/database';
import { MyListsDocument } from '../../../mydb/types/lists';

describe('ListHeaderComponent', () => {
  @Component({
    selector: "app-test",
    standalone: true,
    template: ``,
  })
  class TestComponent {}


  let component: ListHeaderComponent;
  let fixture: ComponentFixture<ListHeaderComponent>;
  
  let authMock: jasmine.SpyObj<AuthService>;
  let dataMock: jasmine.SpyObj<DataService>;
  let itemsRemoveMock: jasmine.Spy;
  let bottomSheetMock: jasmine.SpyObj<MatBottomSheet>;
  let bottomSheetRefMock: jasmine.SpyObj<MatBottomSheetRef>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const AuthMock = jasmine.createSpyObj('AuthService', ['shareLists', 'unshareLists']);
    const DataMock = jasmine.createSpyObj('DataService', [], {db: {items: {find: () => {return {
      remove: () => {},
      patch: () => {}
    }}}}});
    const SnackBarMock = jasmine.createSpyObj('SnackBar', ['open']);
    const BottomSheetMock = jasmine.createSpyObj('BottomSheet', ['open']);
    bottomSheetRefMock = jasmine.createSpyObj('BottomSheetRef', ['afterDissmised']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthMock },
        { provide: DataService, useValue: DataMock },
        { provide: MatSnackBar, useValue: SnackBarMock },
        { provide: MatBottomSheet, useValue: BottomSheetMock },
        provideAnimations(),
        provideRouter([{path: 'user/lists', component: TestComponent}]),
        provideHttpClientTesting(),
      ]
    });
  
    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    bottomSheetMock = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;
    bottomSheetMock.open.and.returnValue(bottomSheetRefMock);

    fixture = TestBed.createComponent(ListHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.lists = signal(MockMyListsDocument) as unknown as WritableSignal<MyListsDocument>;

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
