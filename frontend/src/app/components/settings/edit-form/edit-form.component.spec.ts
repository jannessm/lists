import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFormComponent } from './edit-form.component';
import { Signal, signal } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { MyMeDocument } from '../../../mydb/types/me';

describe('EditFormComponent', () => {
  let component: EditFormComponent;
  let fixture: ComponentFixture<EditFormComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let meSignal: Signal<MyMeDocument | undefined>;

  beforeEach(async () => {
    meSignal = signal(undefined);
    const AuthServiceMock = jasmine.createSpyObj('AuthService', ['changeEmail', 'changePwd', 'logout'], {'me': meSignal});

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceMock },
      ]
    });

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(EditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
