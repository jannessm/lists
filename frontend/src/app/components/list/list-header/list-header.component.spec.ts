import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSettingsComponent } from './list-header.component';

describe('ListSettingsComponent', () => {
  let component: ListSettingsComponent;
  let fixture: ComponentFixture<ListSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
