import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListNormalComponent } from './list-normal.component';

describe('ListNormalComponent', () => {
  let component: ListNormalComponent;
  let fixture: ComponentFixture<ListNormalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListNormalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListNormalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
