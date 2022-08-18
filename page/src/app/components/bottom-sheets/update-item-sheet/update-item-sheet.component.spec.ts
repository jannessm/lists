import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateItemSheetComponent } from './update-item-sheet.component';

describe('UpdateItemSheetComponent', () => {
  let component: UpdateItemSheetComponent;
  let fixture: ComponentFixture<UpdateItemSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateItemSheetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateItemSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
