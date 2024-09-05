export enum ReminderOptions {
    NO_REMINDER = 'no',
    MIN_0 = '0 min',
    MIN_10 = '10 min',
    MIN_30 = '30 min',
    H_1 = '1 h',
    D_1 = '1 d'
}

export function getReminderLabel(option: ReminderOptions) {
    switch(option) {
        case ReminderOptions.NO_REMINDER:
            return 'Keine Erinnerung';
        case ReminderOptions.MIN_0:
        case ReminderOptions.MIN_10:
        case ReminderOptions.MIN_30:
            return option + ' vorher';
        case ReminderOptions.H_1:
            return '1 Std vorher';
        case ReminderOptions.D_1:
            return '1 Tag vorher';
        default:
            return 'MISSING REMINDER LABEL'
    }
}