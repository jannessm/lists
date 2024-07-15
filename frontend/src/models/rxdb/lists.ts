import { ForeignId } from "./common";

export interface Lists {
    id: string;
    name: string;
    isShoppingList: boolean;
    createdBy: ForeignId;
    sharedWith: ForeignId[];
    items: ForeignId[];
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
}

export const listsSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        name: {
            type: 'string'
        },
        isShoppingList: {
            type: 'boolean'
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
        sharedWith: {
            type: 'array',
            items: {
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
            minItems: 1
        },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string'
                    }
                }
            }
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
    required: ['id', 'name', 'isShoppingList', 'createdBy', 'sharedWith', 'items']
};