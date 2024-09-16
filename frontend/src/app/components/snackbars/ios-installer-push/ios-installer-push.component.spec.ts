import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IosInstallerPushComponent } from './ios-installer-push.component';

describe('IosInstallerPushComponent', () => {
  let component: IosInstallerPushComponent;
  let fixture: ComponentFixture<IosInstallerPushComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IosInstallerPushComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IosInstallerPushComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
