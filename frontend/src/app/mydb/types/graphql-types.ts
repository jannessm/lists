import { LISTS_SCHEMA } from "./lists";
import { ME_SCHEMA } from "./me";
import { ITEM_SCHEMA } from "./list-item";
import { JsonSchema } from "./schema";
import { MyPushRow } from "./common";
import { USERS_SCHEMA } from "./users";

export const graphQLGenerationInput = {
    me: {
        schema: ME_SCHEMA,
        checkpointFields: [
            'updatedAt'
        ]
    },
    users: {
        schema: USERS_SCHEMA,
        checkpointFields: [
            'id', 'updatedAt'
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
    USERS = "users",
    LISTS = "lists",
    LIST_ITEM = "items"
}

export type MyGraphQLQuery = {
    query: string;
    variables: {
        [key: string]: any;
    }
}

export type MyQueryBuilder = (checkpoint: any, limit: number) => {
    query: string;
    variables: {
        checkpoint: any;
        limit: number;
    }
};

export type MyStreamBuilder = (headers: any) => {
    query: string;
    variables: {
        headers: any;
    }
}

export type MyPushBuilder = (rows: MyPushRow[]) => {
    query: string;
    variables: {
        [key: string]: MyPushRow[];
    }
}