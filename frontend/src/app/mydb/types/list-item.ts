import { AsTyped } from 'as-typed';
import { ulid } from "ulid";
import { COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";
import { MyDocument } from './classes';
import { MyCollection } from '../collection';

export function newItem(item: any): any {
    const newItem = {
        id: ulid().toLowerCase(),
        name: '',
        description: '',
        createdBy: '',
        reminder: null,
        due: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lists: '',
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false
    }

    item = splitName(item);

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
type MyItemDocumentMethods = {
    links(): string[];
};

export type MyItemDocument = MyDocument<MyItemDocumentType, MyItemDocumentMethods>
export type MyItemCollection = MyCollection<MyItemDocumentType, MyItemDocumentMethods, Signal<unknown>>;

export function itemsConflictHandler(
    forkState: MyItemDocumentType,
    assumedMasterState: MyItemDocumentType | undefined,
    trueMasterState: MyItemDocumentType | undefined,
) {
    // if no master state was ever registered
    if (!assumedMasterState || !trueMasterState || assumedMasterState.id !== forkState.id || trueMasterState.id !== forkState.id) {
        return forkState;
    // overwrite fork state with master changes that are different from the assumedMaster
    } else {
        const newState: MyItemDocumentType = JSON.parse(JSON.stringify(forkState));
        if (assumedMasterState.name !== trueMasterState.name) {
            newState.name = trueMasterState.name;
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
        if (assumedMasterState.timezone !== trueMasterState.timezone) {
            newState.timezone = trueMasterState.timezone;
        }
        if (assumedMasterState.done !== trueMasterState.done) {
            newState.done = trueMasterState.done;
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

export function splitName(item: MyItemDocumentType | {name: string, description?: string | null}, maxLength=50) {
    const parts = item.name.split(' ');
    const newName: string[] = [];
    const newDescription: string[] = [];
    let newNameLen = -1; // first has no space in front
    let wasDomain = false;

    parts.forEach((part) => {
        let parsed;
        try {
            parsed = new URL(part);
        } catch { }
        
        // if part is URL and no domain was parsed yet, set host as name
        // and move the URL to the description
        if (!wasDomain && !!parsed && newName.length === 0) {
            newName.push(parsed.hostname.substring(0, maxLength));
            newDescription.push(part);
            wasDomain = true;
        
        // if part is URL and there is already a name, move URL to description
        } else if (!wasDomain && !!parsed) {
            newDescription.push(part);
            wasDomain = true;

        // if part is not a URL and adding it to the previous name parts is still valid
        } else if (!wasDomain && newNameLen + part.length + 1 <= maxLength) {
            newName.push(part);                    
            newNameLen += part.length + 1;
        
        // else add part to the description
        } else {
            newDescription.push(part);
        }
    });

    item.name = newName.join(' ');

    const newDescriptionJoined = newDescription.join(' ');
    newDescription.length = 0; // clear the array
    if (newDescriptionJoined.length > 0) {
        newDescription.push(newDescriptionJoined);
    }
    if (item.description && item.description.length > 0) {
        newDescription.push(item.description);
    }
    item.description = newDescription.join("\n\n") || null;

    return item;
}