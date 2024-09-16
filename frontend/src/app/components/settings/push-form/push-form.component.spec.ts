import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushFormComponent } from './push-form.component';

describe('PushFormComponent', () => {
  let component: PushFormComponent;
  let fixture: ComponentFixture<PushFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PushFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PushFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
