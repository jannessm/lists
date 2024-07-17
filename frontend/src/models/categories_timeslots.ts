import { ListItem } from "./rxdb/list-item";

export enum TIMESLOTS {
    TODAY = 'Heute',
    TOMORROW = 'Morgen',
    SOON = 'In Kürze',
    SOMETIME = 'Irgendwann',
    NONE = ''
}

export enum TIMESLOT_KEYS {
    TODAY = 'TODAY',
    TOMORROW = 'TOMORROW',
    SOON = 'SOON',
    SOMETIME = 'SOMETIME'
}

export type Time = Date | null;

export function is_past(item: ListItem, _due: Date | undefined = undefined) {
    if (item.due !== null) {
        const now = new Date();
        const due = !_due ? new Date(item.due) : _due;
        return due.getTime() - now.getTime() < 0 ? 1 : 0;
    }

    return 0;
}

export function is_today(item: ListItem, _due: Date | undefined = undefined) {
    if (item.due !== null) {
        const now = new Date();
        const due = !_due ? new Date(item.due) : _due;

        return due.getDate() === now.getDate() && due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() ? 1 : 0;
    }
    return 0;
}

export function is_tomorrow(item: ListItem, _due: Date | undefined = undefined) {
    if (item.due !== null) {
        const now = new Date();
        const due = !_due ? new Date(item.due) : _due;

        return due.getDate() === now.getDate() + 1 && due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() ? 1 : 0;
    }
    return 0;
}

export function is_soon(item: ListItem, _due: Date | undefined = undefined) {
    if (item.due !== null) {
        const now = new Date();
        const due = !_due ? new Date(item.due) : _due;

        return !is_past(item) && !is_today(item) && !is_tomorrow(item) ? 1 : 0;
    }
    return 0;
}

export function is_sometime(item: ListItem) {
    return item.due === null ? 1 : 0;
}