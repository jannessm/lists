import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IosInstallerPushComponent } from './ios-installer-push.component';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBarRefMock } from '../../../../testing/mocks';

describe('IosInstallerPushComponent', () => {
  let component: IosInstallerPushComponent;
  let fixture: ComponentFixture<IosInstallerPushComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBarRef, useValue: MatSnackBarRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IosInstallerPushComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
