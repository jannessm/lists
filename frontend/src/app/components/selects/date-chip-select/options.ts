import { is_today } from "../../../../models/categories_timeslots";

export enum ReminderOption {
  NO_REMINDER = 'no',
  MIN_0 = '0 min',
  MIN_30 = '30 min',
  H_1 = '1 h',
  D_1 = '1 d'
}

export enum DueOption {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  SOMETIME = 'somtime',
}


export const ReminderOptionLabels: [key: string, value: string][] = [
  [ReminderOption.MIN_0, '0 Min vorher'],
  [ReminderOption.MIN_30, '30 Min vorher'],
  [ReminderOption.H_1, '1 Std vorher'],
  [ReminderOption.D_1, '1 Tag vorher'],
  [ReminderOption.NO_REMINDER, 'Keine Erinnerung'],
];

export const DueOptionLabels: [key: string, value: string][] = [
  [DueOption.TODAY, 'Heute'],
  [DueOption.TOMORROW, 'Morgen'],
  [DueOption.SOMETIME, 'Irgendwann']
];

export function getReminderValue(
  due: Date | null,
  reminder: Date | null
): string {
  if (!due || !reminder) {
    return ReminderOption.NO_REMINDER;
  }

  const diff = Math.abs(due.valueOf() - reminder.valueOf());
  const minute = 60 * 1000;
  const hour = 60 * minute;

  switch(diff) {
    case 0:
      return ReminderOption.MIN_0;
    case 30 * minute:
      return ReminderOption.MIN_30;
    case hour:
      return ReminderOption.H_1;
    case 24 * hour:
      return ReminderOption.D_1;
    default:
      return reminder.toISOString();
  }
}

export function getDueValue(due: Date | null): string {
  if (!due) {
    return DueOption.SOMETIME;
  }
  
  const today = new Date();
  // set local time to 9:00
  today.setHours(9,0,0,0);
  const tomorrow = new Date(today.valueOf());
  tomorrow.setHours(today.getHours() + 24);

  if (due.valueOf() === today.valueOf()) {
    return DueOption.TODAY;
  } else if (due.valueOf() === tomorrow.valueOf()) {
    return DueOption.TOMORROW;
  } else {
    return due.toISOString();
  }
}

export function getReminderDate(
  due: Date,
  reminder: ReminderOption | string
): string | null {
  const date = new Date(due.valueOf());

  switch(reminder) {
    case ReminderOption.NO_REMINDER:
      return null;
    case ReminderOption.MIN_30:
      date.setMinutes(due.getMinutes() - 30);
      break;
    case ReminderOption.H_1:
      date.setHours(due.getHours() - 1);
      break
    case ReminderOption.D_1:
      date.setHours(due.getHours() - 24);
      break
    case ReminderOption.MIN_0:
    default:
      break
  }

  return date.toISOString();
}

export function getDueDate(due: DueOption | string): string | null {
  switch(due) {
    case DueOption.TODAY:
      const today = new Date();
      today.setHours(9,0,0,0);
      return today.toISOString();
    case DueOption.TOMORROW:
      const tomorrow = new Date();
      tomorrow.setHours(9 + 24,0,0,0);
      return tomorrow.toISOString();
    case DueOption.SOMETIME:
    default:
      return null;
  }
}