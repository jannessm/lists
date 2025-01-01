import { AsTyped } from 'as-typed';
import { COMMON_SCHEMA } from "./common";
import { MyDocument } from "./classes";
import { MyCollection } from '../collection';

export const USERS_SCHEMA = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
        },
        name: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        
        ...COMMON_SCHEMA
    },
    required: ['id', 'name', 'email']
} as const;

type MyUsersDocumentType = AsTyped<typeof USERS_SCHEMA>;

export type MyUsersDocument = MyDocument<MyUsersDocumentType, {}>
export type MyUsersCollection = MyCollection<MyUsersDocumentType, {}>;