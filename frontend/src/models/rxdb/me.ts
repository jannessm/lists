import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { ForeignId, COMMON_SCHEMA } from "./common";
import { Signal } from "@angular/core";

export enum THEME {
    AUTO = "auto",
    DARK = "dark",
    LIGHT = "light"
}

const ME_SCHEMA_LITERAL = {
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

const schemaTyped = toTypedRxJsonSchema(ME_SCHEMA_LITERAL);
type RxMeDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

export const ME_SCHEMA: RxJsonSchema<RxMeDocumentType> = ME_SCHEMA_LITERAL;

export type RxMeDocument = RxDocument<RxMeDocumentType, {}>
export type RxMeCollection = RxCollection<RxMeDocumentType, {}, unknown, unknown, Signal<RxMeDocument>>;