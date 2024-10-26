import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HCaptchaComponent } from './hcaptcha.component';
import { signal } from '@angular/core';
import { of } from 'rxjs';

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
    
    spyOn(component, 'loadHCaptcha').and.returnValue(of());
    fixture.componentRef.setInput('init', signal(false));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
