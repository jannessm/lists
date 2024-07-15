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

export function is_past(item: ListItem) {
    const now = new Date();
    return item.due !== null && item.due.getTime() - now.getTime() < 0 ? 1 : 0;
}

export function is_today(item: ListItem) {
    const now = new Date();
    return item.due !== null && item.due.getDate() === now.getDate() && item.due.getFullYear() === now.getFullYear() && item.due.getMonth() === now.getMonth() ? 1 : 0;
}

export function is_tomorrow(item: ListItem) {
    const now = new Date();
    return item.due !== null && item.due.getDate() === now.getDate() + 1 && item.due.getFullYear() === now.getFullYear() && item.due.getMonth() === now.getMonth() ? 1 : 0;
}

export function is_soon(item: ListItem) {
    return !is_past(item) && !is_today(item) && !is_tomorrow(item) && item.due !== null ? 1 : 0;
}

export function is_sometime(item: ListItem) {
    return item.due === null ? 1 : 0;
}