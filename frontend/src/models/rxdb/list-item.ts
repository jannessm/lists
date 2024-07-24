import { ulid } from "ulid";
import { ForeignId } from "./common";

export interface ListItem {
    id: string;
    name: string;
    description: string;
    createdBy: ForeignId;
    reminder: string | null;
    due: string | null;
    lists: ForeignId;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
}

export function newItem(item: any) {
    const newItem: ListItem = {
        id: ulid().toLowerCase(),
        name: '',
        description: '',
        createdBy: {id: '', name: ''},
        reminder: '',
        due: '',
        lists: {id: '', name: ''},
        done: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false
    }

    Object.assign(newItem, item);

    return newItem;
}

export const listItemSchema = {
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
        description: {
            type: 'string'
        },
        createdBy: {
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                },
                name: {
                    type: 'string'
                }
            }
        },
        reminder: {
            type: 'string'
        },
        due: {
            type: 'string'
        },
        lists: {
            type: 'object',
            properties: {
                id: {
                    type: 'string'
                }
            }
        },
        done: {
            type: 'boolean'
        },

        // required for rxdb
        createdAt: {
            type: 'string'
        },
        updatedAt: {
            type: 'string'
        },
        _deleted: {
            type: 'boolean'
        }
    },
    required: ['id', 'name', 'createdBy', 'done', 'lists']
};