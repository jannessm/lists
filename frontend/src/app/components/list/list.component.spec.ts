import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ListComponent } from './list.component';
import { AuthService } from '../../services/auth/auth.service';
import { DataService } from '../../services/data/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentRef, DebugElement, NO_ERRORS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { UsersService } from '../../services/users/users.service';
import { AuthServiceSpy } from '../../services/auth/auth.service.mock';
import { DataServiceSpy } from '../../services/data/data.service.mock';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBarMock } from '../../../testing/mocks';
import { UsersServiceSpy } from '../../services/users/users.service.mock';
import { By } from '@angular/platform-browser';
import { click } from '../../../testing/helpers';
import { DateChipSelectComponent } from '../selects/date-chip-select/date-chip-select.component';
import { MyListsDocument, newLists } from '../../mydb/types/lists';
import { MyDocument } from '../../mydb/document';
import { MyShoppingListsCollectionSpy } from '../../services/data/db.mock';


describe('ListComponent', () => {
  let component: ListComponent;
  let componentRef: ComponentRef<ListComponent>;
  let componentEl: DebugElement;
  let fixture: ComponentFixture<ListComponent>;

  let authMock: jasmine.SpyObj<AuthService>;
  let dataMock: jasmine.SpyObj<DataService>;
  let userMock: jasmine.SpyObj<UsersService>;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let user = signal(undefined);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: AuthServiceSpy },
        { provide: DataService, useClass: DataServiceSpy },
        { provide: UsersService, useClass: UsersServiceSpy },
        { provide: MatSnackBar, useValue: MatSnackBarMock },
        provideAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    authMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dataMock = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    userMock = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
    snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentEl = fixture.debugElement;
    
    componentRef.setInput('id', 'list1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('input-bar', () => {
    let inputBar: DebugElement;
    let input: DebugElement;

    beforeEach(() => {
      inputBar = componentEl.query(By.css('.input-bar'));
      input = componentEl.query(By.css('.input-bar .toolbar-input input'));
    });

    describe('should open and focus input', () => {
      let addButton: DebugElement;

      beforeEach(() => {
        addButton = componentEl.query(By.css('.input-bar .toolbar-input button'));
      });

      it('if div is clicked', fakeAsync(() => {
        expect(inputBar).toBeTruthy();
        expect(input).toBeTruthy();
  
        click(inputBar);
        fixture.detectChanges();
        tick(100);
  
        expect(component.focusInput).toBeTrue();
        expect(input.parent?.parent?.classes['focusInput']).toBeTrue();
        expect(input.nativeElement).toBe(document.activeElement);
      }));

      it('if input is clicked', fakeAsync(() => {
        expect(input).toBeTruthy();
  
        click(input);
        fixture.detectChanges();
        tick(100);
  
        expect(component.focusInput).toBeTrue();
        expect(input.parent?.parent?.classes['focusInput']).toBeTrue();
        expect(input.nativeElement).toBe(document.activeElement);
      }));
  
      it('if button is clicked and no add action should perform', fakeAsync(() => {
        expect(input).toBeTruthy();
        expect(addButton).toBeTruthy();
  
        click(addButton);
        fixture.detectChanges();
        tick(100);
  
        expect(dataMock.db.items.insert).toHaveBeenCalledTimes(0);
        expect(component.focusInput).toBeTrue();
        expect(input.parent?.parent?.classes['focusInput']).toBeTrue();
        expect(input.nativeElement).toBe(document.activeElement);
      }));
  
      it('button is clicked and no add action should perform if text in input', fakeAsync(() => {
        expect(input).toBeTruthy();
        expect(addButton).toBeTruthy();
  
        // add text to input
        component.newItem.setValue('text text text');
  
        click(addButton);
        fixture.detectChanges();
        tick(100);
  
        expect(dataMock.db.items.insert).toHaveBeenCalledTimes(0);
        expect(component.focusInput).toBeTrue();
        expect(input.parent?.parent?.classes['focusInput']).toBeTrue();
        expect(input.nativeElement).toBe(document.activeElement);
      }));
    });

    // describe('should focus input after', () => {
    //   let chipSelect: DateChipSelectComponent;
    //   let timepicker;

    //   beforeEach(fakeAsync(async () => {
    //     click(inputBar);
    //     tick(1000);

    //     await fixture.whenStable();

    //     console.log(componentEl.nativeElement);
        
    //     chipSelect = componentEl.query(By.css('.toolbar-time')).componentInstance;
    //     timepicker = chipSelect.flatpickr;

    //     fixture.detectChanges();
    //   }));

    //   it('interaction with chips', fakeAsync(() => {

    //   }));
    // });

  });
});
