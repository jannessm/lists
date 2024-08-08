import { AsTyped } from 'as-typed';
import { ForeignId, COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";
import { MyDocument } from "./document";
import { MyCollection } from "./collection";

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

const schemaTyped = ME_SCHEMA as any;
type RxMeDocumentType = AsTyped<typeof schemaTyped>;

export type MyMeDocument = MyDocument<RxMeDocumentType, {}>
export type MyMeCollection = MyCollection<RxMeDocumentType, {}, Signal<MyMeDocument>>;