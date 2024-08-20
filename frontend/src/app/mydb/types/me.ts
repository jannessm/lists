import { AsTyped } from 'as-typed';
import { COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";
import { MyDocument } from "./classes";
import { MyCollection } from '../collection';

export enum THEME {
    AUTO = "auto",
    DARK = "dark",
    LIGHT = "light"
}

export const ME_SCHEMA = {
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
        emailVerifiedAt: {
            type: ['string', 'null']
        },

        // settings
        theme: {
            type: 'string'
        },
        
        ...COMMON_SCHEMA
    },
    required: ['id', 'name', 'email', 'emailVerifiedAt', 'theme']
} as const;

type MyMeDocumentType = AsTyped<typeof ME_SCHEMA>;

export type MyMeDocument = MyDocument<MyMeDocumentType, {}>
export type MyMeCollection = MyCollection<MyMeDocumentType, {}, Signal<MyMeDocument>>;