import { ulid } from "ulid";
import { ForeignId } from "./common";
import { RxCollection, RxConflictHandler, RxConflictHandlerInput, RxConflictHandlerOutput, RxDocument, deepEqual } from "rxdb";
import { Signal } from "@angular/core";

export interface Lists {
    id: string;
    name: string;
    isShoppingList: boolean;
    createdBy: ForeignId;
    sharedWith: ForeignId[];
    users: () => ForeignId[];
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

export const defaultConflictHandler: RxConflictHandler<any> = function (
    /**
     * The conflict handler gets 3 input properties:
     * - assumedMasterState: The state of the document that is assumed to be on the master branch
     * - newDocumentState: The new document state of the fork branch (=client) that RxDB want to write to the master
     * - realMasterState: The real master state of the document
     */
    i: RxConflictHandlerInput<any>
): Promise<RxConflictHandlerOutput<any>> {
    console.log('conflict', i.newDocumentState);
    /**
     * Here we detect if a conflict exists in the first place.
     * If there is no conflict, we return isEqual=true.
     * If there is a conflict, return isEqual=false.
     * In the default handler we do a deepEqual check,
     * but in your custom conflict handler you probably want
     * to compare specific properties of the document, like the updatedAt time,
     * for better performance because deepEqual() is expensive.
     */
    if (deepEqual(
        i.newDocumentState,
        i.realMasterState
    )) {
        return Promise.resolve({
            isEqual: true
        });
    }

    /**
     * If a conflict exists, we have to resolve it.
     * The default conflict handler will always
     * drop the fork state and use the master state instead.
     * 
     * In your custom conflict handler you likely want to merge properties
     * of the realMasterState and the newDocumentState instead.
     */
    return Promise.resolve({
        isEqual: false,
        documentData: i.realMasterState
    });
};