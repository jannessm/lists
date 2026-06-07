import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import dayjs from 'dayjs';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-date-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './date-time-picker.component.html',
  styleUrl: './date-time-picker.component.scss',
  host: { '(click)': '$event.stopPropagation()' },
})
export class DateTimePickerComponent {
  @Output() dateChange = new EventEmitter<Date>();
  @Output() pickerClosed = new EventEmitter<void>();

  isOpen = false;
  selectedDate: Date | null = null;

  viewYear = dayjs().year();
  viewMonth = dayjs().month(); // 0-based
  timeValue = ''; // HH:mm

  // Captured at construction time so Jasmine's clock mock is respected in tests
  private readonly defaultDate = new Date();

  readonly WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  readonly MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];

  get viewMonthLabel(): string {
    return this.MONTHS[this.viewMonth];
  }

  get calendarWeeks(): (number | null)[][] {
    const firstDay = dayjs(new Date(this.viewYear, this.viewMonth, 1));
    const daysInMonth = firstDay.daysInMonth();
    // dayjs: 0=Sun, convert to Mon=0
    let startDow = firstDay.day();
    startDow = (startDow + 6) % 7;

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    const base = this.selectedDate ? dayjs(this.selectedDate) : dayjs(this.defaultDate);
    this.viewYear = base.year();
    this.viewMonth = base.month();
    this.timeValue = base.format('HH:mm');
    if (!this.selectedDate) {
      this.selectedDate = base.toDate();
    }
  }

  cancel(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.clear();
    this.pickerClosed.emit();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.pickerClosed.emit();
  }

  setDate(date: Date | string, emitChange = false): void {
    const d = dayjs(date);
    this.selectedDate = d.toDate();
    this.viewYear = d.year();
    this.viewMonth = d.month();
    this.timeValue = d.format('HH:mm');
    if (emitChange) {
      this.dateChange.emit(this.selectedDate);
    }
  }

  clear(): void {
    this.selectedDate = null;
    this.timeValue = '';
  }

  selectDay(day: number | null): void {
    if (!day) return;
    const [h, m] = this.timeValue
      ? this.timeValue.split(':').map(Number)
      : [0, 0];
    this.selectedDate = new Date(this.viewYear, this.viewMonth, day, h, m, 0, 0);
    this.dateChange.emit(this.selectedDate);
  }

  onTimeChange(): void {
    if (!this.selectedDate || !this.timeValue) return;
    const [h, m] = this.timeValue.split(':').map(Number);
    this.selectedDate = dayjs(this.selectedDate)
      .set('hour', h)
      .set('minute', m)
      .set('second', 0)
      .set('millisecond', 0)
      .toDate();
    this.dateChange.emit(this.selectedDate);
  }

  prevMonth(): void {
    const d = dayjs(new Date(this.viewYear, this.viewMonth, 1)).subtract(1, 'month');
    this.viewYear = d.year();
    this.viewMonth = d.month();
  }

  nextMonth(): void {
    const d = dayjs(new Date(this.viewYear, this.viewMonth, 1)).add(1, 'month');
    this.viewYear = d.year();
    this.viewMonth = d.month();
  }

  prevYear(): void {
    this.viewYear--;
  }

  nextYear(): void {
    this.viewYear++;
  }

  isSelectedDay(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    const sd = dayjs(this.selectedDate);
    return (
      sd.year() === this.viewYear &&
      sd.month() === this.viewMonth &&
      sd.date() === day
    );
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = dayjs();
    return (
      today.year() === this.viewYear &&
      today.month() === this.viewMonth &&
      today.date() === day
    );
  }
}
