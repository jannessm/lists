import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushFormComponent } from './push-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WebPushService } from '../../../services/web-push/web-push.service';
import { MatSnackBarMock } from '../../../../testing/mocks';
import { WebPushServiceSpy } from '../../../services/web-push/web-push.service.mock';

describe('PushFormComponent', () => {
  let component: PushFormComponent;
  let fixture: ComponentFixture<PushFormComponent>;
  
  let webPushMock: jasmine.SpyObj<WebPushService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: WebPushService, useClass: WebPushServiceSpy },
        { provide: MatSnackBar, useValue: MatSnackBarMock },
      ]
    }).compileComponents();

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
