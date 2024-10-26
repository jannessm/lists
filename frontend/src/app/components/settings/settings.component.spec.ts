import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { AuthService } from '../../services/auth/auth.service';
import { PusherService } from '../../services/pusher/pusher.service';
import { of } from 'rxjs';
import { Component, Input, signal, Signal } from '@angular/core';
import { EditFormComponent } from './edit-form/edit-form.component';
import { ThemeFormComponent } from './theme-form/theme-form.component';
import { PushFormComponent } from './push-form/push-form.component';
import { OthersFormComponent } from './others-form/others-form.component';
import { MyMeDocument } from '../../mydb/types/me';
import { AuthServiceSpy } from '../../services/auth/auth.service.mock';
import { PusherServiceSpy } from '../../services/pusher/pusher.service.mock';

describe('SettingsComponent', () => {
  @Component({
    selector: "app-settings-edit-form",
    standalone: true,
    template: ``,
  })
  class TestEditFormComponent {
    @Input() editMode!: boolean;
    @Input() disabled!: boolean;
  }
  @Component({
    selector: "app-settings-theme-form",
    standalone: true,
    template: ``,
  })
  class TestThemeFormComponent {}
  @Component({
    selector: "app-settings-push-form",
    standalone: true,
    template: ``,
  })
  class TestPushFormComponent {}
  @Component({
    selector: "app-settings-others-form",
    standalone: true,
    template: ``,
  })
  class TestOthersFormComponent {}

  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let pusherMock: jasmine.SpyObj<PusherService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
        { provide: PusherService, useClass: PusherServiceSpy }
      ]
    }).overrideComponent(SettingsComponent, {
      add: {
        imports: [TestEditFormComponent, TestThemeFormComponent, TestPushFormComponent, TestOthersFormComponent]
      },
      remove: {
        imports: [EditFormComponent, ThemeFormComponent, PushFormComponent, OthersFormComponent]
      }
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    pusherMock = TestBed.inject(PusherService) as jasmine.SpyObj<PusherService>;

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
