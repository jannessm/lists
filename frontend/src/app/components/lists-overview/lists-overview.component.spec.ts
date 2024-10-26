import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListsOverviewComponent } from './lists-overview.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AuthService } from '../../services/auth/auth.service';
import { DataService } from '../../services/data/data.service';
import { signal } from '@angular/core';
import { AuthServiceSpy, MockMyListsDocument } from '../../services/auth/auth.service.mock';
import { of } from 'rxjs';
import { DataServiceSpy } from '../../services/data/data.service.mock';
import { MatBottomSheetRefMock } from '../../../testing/mocks';

describe('ListsOverviewComponent', () => {
  let component: ListsOverviewComponent;
  let fixture: ComponentFixture<ListsOverviewComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let dataMock: jasmine.SpyObj<DataService>;
  let bottomSheetMock: jasmine.SpyObj<MatBottomSheet>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
        { provide: DataService, useClass: DataServiceSpy },
        { provide: MatBottomSheet, useValue: MatBottomSheetRefMock },
        provideAnimations(),
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    bottomSheetMock = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;

    fixture = TestBed.createComponent(ListsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
