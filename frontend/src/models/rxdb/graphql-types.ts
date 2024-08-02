import { RxReplicationState } from "rxdb/dist/types/plugins/replication";
import { LISTS_SCHEMA } from "./lists";
import { ME_SCHEMA } from "./me";
import { ITEM_SCHEMA } from "./list-item";

export const graphQLGenerationInput = {
    me: {
        schema: ME_SCHEMA,
        checkpointFields: [
            'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    },
    lists: {
        schema: LISTS_SCHEMA,
        checkpointFields: [
            'id', 'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    },
    items: {
        schema: ITEM_SCHEMA,
        checkpointFields: [
            'id', 'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    }
};

export interface Replications {
    [key: string]: RxReplicationState<unknown, unknown>
}

export enum DATA_TYPE {
    ME = "me",
    // USER = "user",
    LISTS = "lists",
    LIST_ITEM = "items"
}