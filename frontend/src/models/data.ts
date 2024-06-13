export const userSchema = {
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
    required: ['id', 'name', 'email']
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