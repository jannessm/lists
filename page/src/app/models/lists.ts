export interface List {
    uuid: string;
    name: string;
    groceries: boolean;
    todo?: number;
}

export interface Timeslot {
    name: TIMESLOTS;
    items: ListItem[];
}

export enum TIMESLOTS {
    TODAY = 'Heute',
    TOMORROW = 'Morgen',
    SOON = 'In Kürze',
    SOMETIME = 'Irgendwann'
}

export enum TIMESLOT_KEYS {
    TODAY = 'TODAY',
    TOMORROW = 'TOMORROW',
    SOON = 'SOON',
    SOMETIME = 'SOMETIME'
}

export interface ListItem {
    uuid: string;
    name: string;
    done: boolean;
    time?: Date | TIMESLOT_KEYS.SOMETIME;
    created_by: string;
    list_id: string;
}