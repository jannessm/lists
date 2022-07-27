import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateItemDialogComponent } from './update-item-dialog.component';

describe('UpdateItemDialogComponent', () => {
  let component: UpdateItemDialogComponent;
  let fixture: ComponentFixture<UpdateItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateItemDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
