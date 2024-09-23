import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HCaptchaComponent } from './hcaptcha.component';

describe('HCaptchaComponent', () => {
  let component: HCaptchaComponent;
  let fixture: ComponentFixture<HCaptchaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HCaptchaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HCaptchaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
