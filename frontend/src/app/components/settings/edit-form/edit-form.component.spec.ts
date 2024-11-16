import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFormComponent } from './edit-form.component';
import { Signal, signal } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { MyMeDocument } from '../../../mydb/types/me';
import { AuthServiceSpy } from '../../../services/auth/auth.service.mock';

describe('EditFormComponent', () => {
  let component: EditFormComponent;
  let fixture: ComponentFixture<EditFormComponent>;

  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
      ]
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(EditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
