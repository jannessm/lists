import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateTimePickerComponent } from './date-time-picker.component';

describe('DateTimePickerComponent', () => {
  let component: DateTimePickerComponent;
  let fixture: ComponentFixture<DateTimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    fixture = TestBed.createComponent(DateTimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── open / close ──────────────────────────────────────────────────────────

  it('should be closed initially', () => {
    expect(component.isOpen).toBeFalse();
    expect(fixture.debugElement.query(By.css('.picker-popup'))).toBeNull();
  });

  it('should open on open()', () => {
    component.open();
    fixture.detectChanges();
    expect(component.isOpen).toBeTrue();
    expect(fixture.debugElement.query(By.css('.picker-popup'))).toBeTruthy();
  });

  it('should close on close()', () => {
    component.open();
    fixture.detectChanges();
    component.close();
    fixture.detectChanges();
    expect(component.isOpen).toBeFalse();
    expect(fixture.debugElement.query(By.css('.picker-popup'))).toBeNull();
  });

  it('should emit pickerClosed when close() is called', () => {
    component.open();
    fixture.detectChanges();

    const spy = jasmine.createSpy('pickerClosed');
    component.pickerClosed.subscribe(spy);

    component.close();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should close when clicking the backdrop', () => {
    component.open();
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.picker-backdrop'));
    expect(backdrop).toBeTruthy();
    backdrop.nativeElement.click();
    fixture.detectChanges();

    expect(component.isOpen).toBeFalse();
  });

  it('clicking the popup should NOT close it', () => {
    component.open();
    fixture.detectChanges();

    const popup = fixture.debugElement.query(By.css('.picker-popup'));
    popup.nativeElement.click();
    fixture.detectChanges();

    expect(component.isOpen).toBeTrue();
  });

  // ── year navigation ───────────────────────────────────────────────────────

  it('should increase year when nextYear button is clicked', () => {
    component.open();
    fixture.detectChanges();
    const before = component.viewYear;

    const btns = fixture.debugElement.queryAll(By.css('.nav-row:first-child .nav-btn'));
    // first nav-row = year row; second button = next (»)
    btns[1].nativeElement.click();
    fixture.detectChanges();

    expect(component.viewYear).toBe(before + 1);
  });

  it('should decrease year when prevYear button is clicked', () => {
    component.open();
    fixture.detectChanges();
    const before = component.viewYear;

    const btns = fixture.debugElement.queryAll(By.css('.nav-row:first-child .nav-btn'));
    btns[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.viewYear).toBe(before - 1);
  });

  it('prevYear/nextYear buttons do NOT close the popup', () => {
    component.open();
    fixture.detectChanges();

    const btns = fixture.debugElement.queryAll(By.css('.nav-row:first-child .nav-btn'));
    btns[0].nativeElement.click();
    fixture.detectChanges();
    expect(component.isOpen).toBeTrue();

    btns[1].nativeElement.click();
    fixture.detectChanges();
    expect(component.isOpen).toBeTrue();
  });

  // ── month navigation ──────────────────────────────────────────────────────

  it('should increase month when nextMonth button is clicked', () => {
    component.open();
    component.viewMonth = 5; // June
    fixture.detectChanges();

    const monthNavBtns = fixture.debugElement.queryAll(By.css('.nav-row:nth-child(2) .nav-btn'));
    monthNavBtns[1].nativeElement.click();
    fixture.detectChanges();

    expect(component.viewMonth).toBe(6);
  });

  it('should decrease month when prevMonth button is clicked', () => {
    component.open();
    component.viewMonth = 5;
    fixture.detectChanges();

    const monthNavBtns = fixture.debugElement.queryAll(By.css('.nav-row:nth-child(2) .nav-btn'));
    monthNavBtns[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.viewMonth).toBe(4);
  });

  it('should wrap month correctly from December to January and adjust year', () => {
    component.open();
    component.viewYear = 2024;
    component.viewMonth = 11; // December
    fixture.detectChanges();

    component.nextMonth();
    fixture.detectChanges();

    expect(component.viewMonth).toBe(0); // January
    expect(component.viewYear).toBe(2025);
  });

  it('should wrap month correctly from January to December and adjust year', () => {
    component.open();
    component.viewYear = 2024;
    component.viewMonth = 0; // January
    fixture.detectChanges();

    component.prevMonth();
    fixture.detectChanges();

    expect(component.viewMonth).toBe(11); // December
    expect(component.viewYear).toBe(2023);
  });

  it('prevMonth/nextMonth buttons do NOT close the popup', () => {
    component.open();
    fixture.detectChanges();

    const monthNavBtns = fixture.debugElement.queryAll(By.css('.nav-row:nth-child(2) .nav-btn'));
    monthNavBtns[0].nativeElement.click();
    fixture.detectChanges();
    expect(component.isOpen).toBeTrue();

    monthNavBtns[1].nativeElement.click();
    fixture.detectChanges();
    expect(component.isOpen).toBeTrue();
  });

  // ── day selection ─────────────────────────────────────────────────────────

  it('should select a day and emit dateChange', () => {
    component.open();
    component.viewYear = 2024;
    component.viewMonth = 2; // March
    component.timeValue = '09:30';
    fixture.detectChanges();

    const emitted: Date[] = [];
    component.dateChange.subscribe((d: Date) => emitted.push(d));

    // click on day 15
    const dayCells = fixture.debugElement.queryAll(
      By.css('.day-cell:not([disabled]):not(.empty)')
    );
    const cell15 = dayCells.find(
      c => c.nativeElement.textContent.trim() === '15'
    );
    expect(cell15).toBeTruthy();
    cell15!.nativeElement.click();
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0].getFullYear()).toBe(2024);
    expect(emitted[0].getMonth()).toBe(2);
    expect(emitted[0].getDate()).toBe(15);
    expect(emitted[0].getHours()).toBe(9);
    expect(emitted[0].getMinutes()).toBe(30);

    expect(component.selectedDate).toEqual(emitted[0]);
  });

  // ── setDate / clear ───────────────────────────────────────────────────────

  it('setDate should update selectedDate, viewYear, viewMonth and timeValue', () => {
    const d = new Date(2030, 7, 20, 14, 45); // Aug 20 2030, 14:45
    component.setDate(d);

    expect(component.selectedDate!.valueOf()).toBe(d.valueOf());
    expect(component.viewYear).toBe(2030);
    expect(component.viewMonth).toBe(7);
    expect(component.timeValue).toBe('14:45');
  });

  it('setDate with emitChange=true should emit dateChange', () => {
    const emitted: Date[] = [];
    component.dateChange.subscribe((d: Date) => emitted.push(d));

    const d = new Date(2030, 7, 20, 14, 45);
    component.setDate(d, true);

    expect(emitted.length).toBe(1);
    expect(emitted[0].valueOf()).toBe(d.valueOf());
  });

  it('clear should reset selectedDate and timeValue', () => {
    component.setDate(new Date(2030, 0, 1, 8, 0));
    component.clear();

    expect(component.selectedDate).toBeNull();
    expect(component.timeValue).toBe('');
  });

  // ── calendarWeeks ─────────────────────────────────────────────────────────

  it('calendarWeeks should contain all days of the month', () => {
    component.viewYear = 2024;
    component.viewMonth = 1; // Feb 2024 (leap year → 29 days)

    const allDays = component.calendarWeeks
      .flat()
      .filter((d): d is number => d !== null);

    expect(allDays.length).toBe(29);
    expect(allDays[0]).toBe(1);
    expect(allDays[28]).toBe(29);
  });

  it('each week in calendarWeeks should have exactly 7 cells', () => {
    component.viewYear = 2024;
    component.viewMonth = 0; // January

    for (const week of component.calendarWeeks) {
      expect(week.length).toBe(7);
    }
  });
});
