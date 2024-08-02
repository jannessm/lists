import { ulid } from "ulid";
import { ForeignId, COMMON_SCHEMA } from "./common";
import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxConflictHandler, RxConflictHandlerInput, RxConflictHandlerOutput, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { Signal } from "@angular/core";


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

const ITEM_SCHEMA_LITERAL = {
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
        lists: {
            type: 'string'
        },
        ...COMMON_SCHEMA
    },
    required: ['id', 'name', 'createdBy', 'done', 'lists']
} as const;

const schemaTyped = toTypedRxJsonSchema(ITEM_SCHEMA_LITERAL);
type RxItemDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

// ORM methods
type RxItemDocumentMethods = { };

export const ITEM_SCHEMA: RxJsonSchema<RxItemDocumentType> = ITEM_SCHEMA_LITERAL;

export type RxItemDocument = RxDocument<RxItemDocumentType, RxItemDocumentMethods>
export type RxItemCollection = RxCollection<RxItemDocumentType, RxItemDocumentMethods, unknown, unknown, Signal<unknown>>;

export const itemsConflictHandler: RxConflictHandler<RxItemDocument> = function (
    /**
     * The conflict handler gets 3 input properties:
     * - assumedMasterState: The state of the document that is assumed to be on the master branch
     * - newDocumentState: The new document state of the fork branch (=client) that RxDB want to write to the master
     * - realMasterState: The real master state of the document
     */
    i: RxConflictHandlerInput<RxItemDocument>,
    _context: string
): Promise<RxConflictHandlerOutput<RxItemDocument>> {
    console.log(_context);
    /**
     * Here we detect if a conflict exists in the first place.
     * If there is no conflict, we return isEqual=true.
     * If there is a conflict, return isEqual=false.
     * In the default handler we do a deepEqual check,
     * but in your custom conflict handler you probably want
     * to compare specific properties of the document, like the updatedAt time,
     * for better performance because deepEqual() is expensive.
     */
    let isEqual = true;
    if (i.newDocumentState.id !== i.realMasterState.id) {
        isEqual = false;
        console.log('ids neq', i.newDocumentState.id, i.realMasterState.id);
    }
    if (i.newDocumentState.name !== i.realMasterState.name) {
        isEqual = false;
        console.log('names neq', i.newDocumentState.name, i.realMasterState.name);
    }
    if (i.newDocumentState.description !== i.realMasterState.description) {
        isEqual = false;
        console.log('descriptions neq', i.newDocumentState.description, i.realMasterState.description);
    }
    if (i.newDocumentState.createdBy.id !== i.realMasterState.createdBy.id) {
        isEqual = false;
        console.log('createdBy.ids neq', i.newDocumentState.createdBy.id, i.realMasterState.createdBy.id);
    }
    if (i.newDocumentState.reminder !== i.realMasterState.reminder) {
        isEqual = false;
        console.log('reminders neq', i.newDocumentState.reminder, i.realMasterState.reminder);
    }
    if (i.newDocumentState.due !== i.realMasterState.due) {
        isEqual = false;
        console.log('dues neq', i.newDocumentState.due, i.realMasterState.due);
    }
    if (i.newDocumentState.lists !== i.realMasterState.lists &&
        (i.newDocumentState.lists as any).id !== (i.realMasterState.lists as any).id) {
        isEqual = false;
        console.log('listss neq', i.newDocumentState.lists, i.realMasterState.lists);
    }
    if (i.newDocumentState.done !== i.realMasterState.done) {
        isEqual = false;
        console.log('dones neq', i.newDocumentState.done, i.realMasterState.done);
    }
    if (i.newDocumentState.updatedAt !== i.realMasterState.updatedAt) {
        isEqual = false;
        console.log('updatedAts neq', i.newDocumentState.updatedAt, i.realMasterState.updatedAt);
    }
    if (i.newDocumentState._deleted !== i.realMasterState._deleted) {
        isEqual = false;
        console.log('_deleteds neq', i.newDocumentState._deleted, i.realMasterState._deleted);
    }

    if (isEqual) {
        console.log('no conflict', i);
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