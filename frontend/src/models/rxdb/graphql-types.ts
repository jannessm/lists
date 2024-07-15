import { RxReplicationState } from "rxdb/dist/types/plugins/replication";
import { listsSchema } from "./lists";
import { meSchema } from "./me";

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
    }
};

export interface DataType {
    id: string;
}

export interface Replications {
    [key: string]: RxReplicationState<unknown, unknown>
}

export enum DATA_TYPE {
    ME = "me",
    // USER = "user",
    LISTS = "lists"
}