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
import { AuthServiceSpy, MockMyListsDocument } from '../../../services/auth/auth.service.mock';
import { MyListsDatabase } from '../../../mydb/types/database';
import { MyListsDocument } from '../../../mydb/types/lists';
import { DataServiceSpy } from '../../../services/data/data.service.mock';
import { MatBottomSheetMock, MatSnackBarMock } from '../../../../testing/mocks';

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
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
        { provide: DataService, useClass: DataServiceSpy },
        { provide: MatSnackBar, useValue: MatSnackBarMock },
        { provide: MatBottomSheet, useClass: MatBottomSheetMock },
        provideAnimations(),
        provideRouter([{path: 'user/lists', component: TestComponent}]),
        provideHttpClientTesting(),
      ]
    }).compileComponents();
  
    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    bottomSheetMock = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;

    fixture = TestBed.createComponent(ListHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.lists = signal(MockMyListsDocument) as unknown as WritableSignal<MyListsDocument>;

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
