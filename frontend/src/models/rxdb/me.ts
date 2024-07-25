import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, toTypedRxJsonSchema } from "rxdb";
import { ForeignId } from "./common";
import { Signal } from "@angular/core";

export enum THEME {
    AUTO = "auto",
    DARK = "dark",
    LIGHT = "light"
}

export type User = {
    id: string;
    name: string;
    email: string;
    emailVerfiedAt: string | null;
    theme?: THEME;
    defaultList: ForeignId | null;
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
}

export const meSchema = {
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

        // required for rxdb
        createdAt: {
            type: 'string'
        },
        updatedAt: {
            type: 'string'
        },
        _deleted: {
            type: 'boolean'
        }
    },
    required: ['id', 'name', 'email', 'emailVerifiedAt', 'theme']
};

export type RxMeDocument = RxDocument<User, {}>
export type RxMeCollection = RxCollection<User, {}, unknown, unknown, Signal<RxMeDocument>>;