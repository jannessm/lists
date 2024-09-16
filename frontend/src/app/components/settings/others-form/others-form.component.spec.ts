import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OthersFormComponent } from './others-form.component';

describe('OthersFormComponent', () => {
  let component: OthersFormComponent;
  let fixture: ComponentFixture<OthersFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OthersFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OthersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
