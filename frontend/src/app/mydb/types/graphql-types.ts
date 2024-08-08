import { LISTS_SCHEMA } from "./lists";
import { ME_SCHEMA } from "./me";
import { ITEM_SCHEMA } from "./list-item";
import { JsonSchema } from "./schema";

export const graphQLGenerationInput = {
    me: {
        schema: ME_SCHEMA,
        checkpointFields: [
            'updatedAt'
        ]
    },
    lists: {
        schema: LISTS_SCHEMA,
        checkpointFields: [
            'id', 'updatedAt'
        ]
    },
    items: {
        schema: ITEM_SCHEMA,
        checkpointFields: [
            'id', 'updatedAt'
        ]
    }
};

export type GraphQLSchema = {
    schema: JsonSchema;
    checkpointFields: string[];
}

export enum DATA_TYPE {
    ME = "me",
    // USER = "user",
    LISTS = "lists",
    LIST_ITEM = "items"
}