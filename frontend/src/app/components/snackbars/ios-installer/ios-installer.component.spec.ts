import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IosInstallerComponent } from './ios-installer.component';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBarRefMock } from '../../../../testing/mocks';

describe('IosInstallerComponent', () => {
  let component: IosInstallerComponent;
  let fixture: ComponentFixture<IosInstallerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBarRef, useValue: MatSnackBarRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IosInstallerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
