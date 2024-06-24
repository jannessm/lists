export enum THEME {
    AUTO = "auto",
    DARK = "dark",
    LIGHT = "light"
}

export interface User {
    id: string;
    name: string;
    email: string;
    emailVerfiedAt: boolean;
    theme?: THEME;
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

export const taskSchema = {
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
        done: {
            type: 'boolean'
        },
        user: {
            type: 'object',
            properties: {
                id: {
                    type: 'integer'
                }
            }
        },

        // required for rxdb
        createdAt: {
            type: 'integer'
        },
        updatedAt: {
            type: 'integer'
        },
        _deleted: {
            type: 'boolean'
        }
    },
    required: ['id', 'name', 'done']
};

export const graphQLGenerationInput = {
    me: {
        schema: meSchema,
        checkpointFields: [
            'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    },
    tasks: {
        schema: taskSchema,
        checkpointFields: [
            'id',
            'updatedAt'
        ],
        deletedField: '_deleted',
        headerFields: ['X-XSRF-TOKEN']
    }
};

export interface DataType {
    id: string;
}

export enum DATA_TYPE {
    ME = "me",
    USER = "user",
    TASK = "task"
}

export interface Task {
    id: string;
    name: string;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    _deleted: boolean;
}