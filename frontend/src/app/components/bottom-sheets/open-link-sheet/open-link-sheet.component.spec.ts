import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenLinkSheetComponent } from './open-link-sheet.component';

describe('OpenLinkSheetComponent', () => {
  let component: OpenLinkSheetComponent;
  let fixture: ComponentFixture<OpenLinkSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenLinkSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenLinkSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
