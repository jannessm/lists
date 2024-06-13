export interface Checkpoint {
    id: string;
    updatedAt: string;
}

export interface Push<T> {
    newDocumentState: T;
    assumedMasterState: T;
}