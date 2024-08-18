import { Collection } from "dexie";

export type MyDocument<DocumentType, DocumentMethods> = MyDocumentBase & DocumentType & DocumentMethods;

interface MyDocumentBase {
    patch: (doc: any) => Promise<undefined>;
    remove: () => Promise<undefined>;
}

export type QueryObject = {
    filter: (doc: any) => boolean;
    query: () => Promise<any | any[]>;
}