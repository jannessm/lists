import { ulid } from "ulid";
import { ForeignId } from "./common";
import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, toTypedRxJsonSchema } from "rxdb";
import { Signal } from "@angular/core";

export interface Lists {
    id: string;
    name: string;
    isShoppingList: boolean;
    createdBy: ForeignId;
    sharedWith: ForeignId[];
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
}

export function newLists(lists: any): any {
    const newLists = {
        id: ulid().toLowerCase(),
        name: '',
        isShoppingList: false,
        createdBy: {id: '', name: ''},
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false
    };

    Object.assign(newLists, lists);

    return newLists;
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
    required: ['id', 'name', 'isShoppingList', 'createdBy', 'sharedWith']
};


export type RxListsDocument = RxDocument<Lists, {}>
export type RxListsCollection = RxCollection<Lists, {}, unknown, unknown, Signal<unknown>>;