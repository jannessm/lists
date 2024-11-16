import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent } from './list.component';
import { AuthService } from '../../services/auth/auth.service';
import { DataService } from '../../services/data/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { UsersService } from '../../services/users/users.service';
import { AuthServiceSpy } from '../../services/auth/auth.service.mock';
import { DataServiceSpy } from '../../services/data/data.service.mock';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBarMock } from '../../../testing/mocks';
import { UsersServiceSpy } from '../../services/users/users.service.mock';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let dataMock: jasmine.SpyObj<DataService>;
  let userMock: jasmine.SpyObj<UsersService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let user = signal(undefined);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
        { provide: DataService, useClass: DataServiceSpy },
        { provide: UsersService, useClass: UsersServiceSpy },
        { provide: MatSnackBar, useValue: MatSnackBarMock },
        provideAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dataMock = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    userMock = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.id = 'asdf';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
