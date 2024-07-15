import { ForeignId } from "./common";

export enum THEME {
    AUTO = "auto",
    DARK = "dark",
    LIGHT = "light"
}

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerfiedAt: boolean | null;
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
            type: 'boolean'
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