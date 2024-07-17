import { ForeignId } from "./common";

export interface ListItem {
    id: string;
    name: string;
    description: string;
    createdBy: ForeignId;
    reminder: string;
    due: string;
    lists: ForeignId;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
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