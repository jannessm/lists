import { ulid } from "ulid";
import { ForeignId } from "./common";
import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, toTypedRxJsonSchema } from "rxdb";
import { Signal } from "@angular/core";

export interface ListItem {
    id: string;
    name: string;
    description: string | null;
    createdBy: ForeignId;
    reminder: string | null;
    due: string | null;
    // lists: ForeignId;
    lists: string;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
}

export function newItem(item: any): any {
    const newItem = {
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
            type: ['string', 'null']
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
            type: ['string', 'null']
        },
        due: {
            type: ['string', 'null']
        },
        // lists: {
        //     type: 'object',
        //     properties: {
        //         id: {
        //             type: 'string'
        //         }
        //     }
        // },
        lists: {
            type: 'string'
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

const schemaTyped = toTypedRxJsonSchema(listItemSchema);
export type RxItemsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export type RxItemsDocument = RxDocument<ListItem, {}>
export type RxItemsCollection = RxCollection<ListItem, {}, unknown, unknown, Signal<unknown>>;