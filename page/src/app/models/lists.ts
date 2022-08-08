import { Time } from "./categories_timeslots";

export interface List {
    uuid: string;
    name: string;
    groceries: boolean;
    todo?: number;
    shared: boolean;
    users: string[];
}

export interface ListItem {
    uuid: string;
    name: string;
    done: boolean;
    time: Time;
    created_by: string;
    list_id: string;
}