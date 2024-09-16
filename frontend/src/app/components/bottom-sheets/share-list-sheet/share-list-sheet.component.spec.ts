import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareListSheetComponent } from './share-list-sheet.component';

describe('ShareListSheetComponent', () => {
  let component: ShareListSheetComponent;
  let fixture: ComponentFixture<ShareListSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareListSheetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareListSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
