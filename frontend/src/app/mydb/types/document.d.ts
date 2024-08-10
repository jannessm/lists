import { Observable } from "rxjs";

export type MyDocument<DocumentType, DocumentMethods> = {
    $: Observable;
    $$: Subject<DocumentType>;
    patch: (newDoc: any) => Promise<undefined>;
} & DocumentType & DocumentMethods;