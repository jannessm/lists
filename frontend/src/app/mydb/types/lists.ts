import { AsTyped } from 'as-typed';
import { ulid } from "ulid";
import { ForeignId, COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";
import { MyDocument } from './classes';
import { MyCollection } from '../collection';

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

export const LISTS_SCHEMA = {
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
        ...COMMON_SCHEMA
    },
    required: ['id', 'name', 'isShoppingList', 'createdBy', 'sharedWith']
} as const;

type MyListsDocumentType = AsTyped<typeof LISTS_SCHEMA>;

type MyListsMethods = {
    users(): ForeignId[];
}

export type MyListsDocument = MyDocument<MyListsDocumentType, MyListsMethods>
export type MyListsCollection = MyCollection<MyListsDocumentType, MyListsMethods, Signal<unknown>>;

// export const defaultConflictHandler: RxConflictHandler<any> = function (
//     /**
//      * The conflict handler gets 3 input properties:
//      * - assumedMasterState: The state of the document that is assumed to be on the master branch
//      * - newDocumentState: The new document state of the fork branch (=client) that RxDB want to write to the master
//      * - realMasterState: The real master state of the document
//      */
//     i: RxConflictHandlerInput<any>
// ): Promise<RxConflictHandlerOutput<any>> {
//     /**
//      * Here we detect if a conflict exists in the first place.
//      * If there is no conflict, we return isEqual=true.
//      * If there is a conflict, return isEqual=false.
//      * In the default handler we do a deepEqual check,
//      * but in your custom conflict handler you probably want
//      * to compare specific properties of the document, like the updatedAt time,
//      * for better performance because deepEqual() is expensive.
//      */
//     if (deepEqual(
//         i.newDocumentState,
//         i.realMasterState
//         )) {
//         console.log('conflictHandler equal');
//         return Promise.resolve({
//             isEqual: true
//         });
//     }

//     console.log('conflictHandler: <new>', i.newDocumentState.updatedAt, '<ass>', i.assumedMasterState?.updatedAt, '<real>', i.realMasterState.updatedAt);
//     /**
//      * If a conflict exists, we have to resolve it.
//      * The default conflict handler will always
//      * drop the fork state and use the master state instead.
//      * 
//      * In your custom conflict handler you likely want to merge properties
//      * of the realMasterState and the newDocumentState instead.
//      */
//     return Promise.resolve({
//         isEqual: false,
//         documentData: i.realMasterState
//     });
// };