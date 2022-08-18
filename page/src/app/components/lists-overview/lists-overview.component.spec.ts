import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListsOverviewComponent } from './lists-overview.component';

describe('ListsOverviewComponent', () => {
  let component: ListsOverviewComponent;
  let fixture: ComponentFixture<ListsOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListsOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
