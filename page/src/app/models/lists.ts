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

export interface ListItem {
    uuid: string;
    name: string;
    done: boolean;
    time?: Date;
    created_by: string;
}