import Dexie from "dexie";
import { MyDocument } from "./document";

export type MyCollection<DocumentType, DocumentMethods, Reactivity> = {
    db: Dexie;
    primaryKey: string;
    find: (options: QueryOptions) => MyDocument<DocumentType, DocumentMethods>[];
    findOne: () => MyDocument<DocumentType, DocumentMethods>;
    insert: (doc: DocumentType) => Promise<undefined>;
    masterBulkAdd: (docs: DocumentType) => Promise<undefined>
    remove: () => Promis<void>
    getLastCheckpoint: () => Promise<unknown | undefined>
    setCheckpoint: (checkpoint: unknown) => Promise<undefined>
};