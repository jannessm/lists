import { Collection } from "dexie";

export type MyDocument<DocumentType, DocumentMethods> = MyDocumentBase & DocumentType & DocumentMethods;

interface MyDocumentBase {
    patch: (doc: any) => Promise<undefined | void>;
    remove: () => Promise<undefined | void>;
}

export type QueryObject = {
    filter: (doc: any) => boolean;
    query: () => Promise<any | any[]>;
}