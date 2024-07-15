import { RxReplicationState } from "rxdb/dist/types/plugins/replication";
import { listsSchema } from "./lists";
import { meSchema } from "./me";
import { listItemSchema } from "./list-item";

export const graphQLGenerationInput = {
    me: {
        schema: meSchema,
        checkpointFields: [
            'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    },
    lists: {
        schema: listsSchema,
        checkpointFields: [
            'id', 'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    },
    items: {
        schema: listItemSchema,
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