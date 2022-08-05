import { NotExpr } from "@angular/compiler";

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

export function is_past(time: Time) {
    const now = new Date();
    return time !== null && time.getTime() - now.getTime() < 0
}

export function is_today(time: Time) {
    const now = new Date();
    return time !== null && time.getDate() === now.getDate() && time.getFullYear() === now.getFullYear() && time.getMonth() === now.getMonth();
}

export function is_tomorrow(time: Time) {
    const now = new Date();
    return time !== null && time.getDate() === now.getDate() + 1 && time.getFullYear() === now.getFullYear() && time.getMonth() === now.getMonth();
}

export function is_soon(time: Time) {
    return !is_past(time) && !is_today(time) && !is_tomorrow(time) && time !== null;
}

export function is_sometime(time: Time) {
    return time === null;
}

export interface ListItem {
    uuid: string;
    name: string;
    done: boolean;
    time: Time;
    created_by: string;
    list_id: string;
}