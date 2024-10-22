import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushFormComponent } from './push-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WebPushService } from '../../../services/web-push/web-push.service';

describe('PushFormComponent', () => {
  let component: PushFormComponent;
  let fixture: ComponentFixture<PushFormComponent>;
  
  let webPushMock: jasmine.SpyObj<WebPushService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const WebPushMock = jasmine.createSpyObj('WebPushMock', ['settings', 'sub', 'subscribe', 'patchSettings'], {'subscribeChallanged': false});
    const SnackBarMock = jasmine.createSpyObj('SnackBar', ['open']);


    TestBed.configureTestingModule({
      providers: [
        { provide: WebPushService, useValue: WebPushMock },
        { provide: MatSnackBar, useValue: SnackBarMock },
      ]
    });

    webPushMock = TestBed.inject(WebPushService) as jasmine.SpyObj<WebPushService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(PushFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
