import { AsTyped } from 'as-typed';
import { ulid } from "ulid";
import { COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";
import { MyDocument } from './classes';
import { MyCollection } from '../collection';
import { ReminderOptions } from '../../components/selects/reminder-select/options';


export function newItem(item: any, defaultReminder?: string): any {
    const newItem = {
        id: ulid().toLowerCase(),
        name: '',
        description: '',
        createdBy: {id: '', name: ''},
        reminder: defaultReminder || ReminderOptions.MIN_0,
        due: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lists: {id: '', name: ''},
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false
    }

    Object.assign(newItem, item);

    return newItem;
}

export const ITEM_SCHEMA = {
    title: 'a',
    description: 'a',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 50
        },
        name: {
            type: 'string'
        },
        done: {
            type: 'boolean'
        },
        description: {
            type: ['string', 'null']
        },
        createdBy: {
            type: 'string',
        },
        reminder: {
            type: ['string', 'null']
        },
        due: {
            type: ['string', 'null']
        },
        timezone: {
            type: 'string'
        },
        lists: {
            type: 'string'
        },
        ...COMMON_SCHEMA
    },
    required: ['id', 'name', 'createdBy', 'done', 'lists']
} as const;

type MyItemDocumentType = AsTyped<typeof ITEM_SCHEMA>;

// ORM methods
type MyItemDocumentMethods = { };

export type MyItemDocument = MyDocument<MyItemDocumentType, MyItemDocumentMethods>
export type MyItemCollection = MyCollection<MyItemDocumentType, MyItemDocumentMethods, Signal<unknown>>;

export function itemsConflictHandler(
    forkState: MyItemDocumentType,
    assumedMasterState: MyItemDocumentType | undefined,
    trueMasterState: MyItemDocumentType | undefined,
) {
    // if no master state was ever registered
    if (!assumedMasterState || !trueMasterState) {
        return forkState;
    // overwrite fork state with master changes that are different from the assumedMaster
    } else {
        const newState: MyItemDocumentType = JSON.parse(JSON.stringify(forkState));
        if (assumedMasterState.name !== trueMasterState.name) {
            newState.name = trueMasterState.name;
        }
        if (assumedMasterState.done !== trueMasterState.done) {
            newState.done = trueMasterState.done;
        }
        if (assumedMasterState.description !== trueMasterState.description) {
            newState.description = trueMasterState.description;
        }
        if (assumedMasterState.reminder !== trueMasterState.reminder) {
            newState.reminder = trueMasterState.reminder;
        }
        if (assumedMasterState.due !== trueMasterState.due) {
            newState.due = trueMasterState.due;
        }
        if (assumedMasterState.updatedAt !== trueMasterState.updatedAt) {
            newState.updatedAt = trueMasterState.updatedAt;
        }
        if (assumedMasterState._deleted !== trueMasterState._deleted) {
            newState._deleted = trueMasterState._deleted;
        }

        return newState;
    }
}