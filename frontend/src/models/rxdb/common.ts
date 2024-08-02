export interface ForeignId {
    id: string;
    name?: string;
}

export interface Checkpoint {
    id: string;
    updatedAt: string;
}

export const COMMON_SCHEMA = {
    createdAt: {
        type: 'string'
    },
    clientUpdatedAt: {
        type: 'string'
    },
    updatedAt: {
        type: 'string'
    },
    _deleted: {
        type: 'boolean'
    }
} as const;