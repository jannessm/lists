import { AsTyped } from 'as-typed';
import { ulid } from "ulid";
import { COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";
import { MyDocument } from './classes';
import { MyCollection } from '../collection';

export function newLists(lists: any): any {
    const newLists = {
        id: ulid().toLowerCase(),
        name: '',
        isShoppingList: false,
        createdBy: '',
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: null,
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
            type: 'string',
        },
        sharedWith: {
            type: 'array',
            items: {
                type: 'string',
            }
        },
        ...COMMON_SCHEMA
    },
    required: ['id', 'name', 'isShoppingList', 'createdBy', 'sharedWith']
} as const;

type MyListsDocumentType = AsTyped<typeof LISTS_SCHEMA>;

type MyListsMethods = {
    users(): string[];
    isCreated(): boolean;
}

export type MyListsDocument = MyDocument<MyListsDocumentType, MyListsMethods>
export type MyListsCollection = MyCollection<MyListsDocumentType, MyListsMethods, Signal<unknown>>;

export function listsConflictHandler(
    forkState: MyListsDocumentType,
    assumedMasterState: MyListsDocumentType | undefined,
    trueMasterState: MyListsDocumentType | undefined,
) {
     // if no master state was ever registered
     if (!assumedMasterState || !trueMasterState) {
        return forkState;
    // overwrite fork state with master changes that are different from the assumedMaster
    } else {
        const newState: MyListsDocumentType = JSON.parse(JSON.stringify(forkState));

        if (assumedMasterState.name !== trueMasterState.name) {
            newState.name = trueMasterState.name;
        }
        if (assumedMasterState.isShoppingList !== trueMasterState.isShoppingList) {
            newState.isShoppingList = trueMasterState.isShoppingList;
        }
        if (assumedMasterState.sharedWith.length !== trueMasterState.sharedWith.length) {
            newState.sharedWith = trueMasterState.sharedWith;
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
