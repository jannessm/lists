import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareListDialogComponent } from './share-list-dialog.component';

describe('ShareListDialogComponent', () => {
  let component: ShareListDialogComponent;
  let fixture: ComponentFixture<ShareListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareListDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
