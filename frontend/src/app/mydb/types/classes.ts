export type MyDocument<DocumentType, DocumentMethods> = MyDocumentBase & DocumentType & DocumentMethods;

interface MyDocumentBase {
    patch: (doc: any) => Promise<undefined>;
    remove: () => Promise<undefined>;
}