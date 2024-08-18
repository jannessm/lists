import { Signal } from "@angular/core";
import { MyCollection } from "./collection";
import { Observable, Subject, filter, map } from "rxjs";

export class MyDocument<DocType, DocMethods> {
    private subject: Subject<MyDocument<DocType, DocMethods>> = new Subject();
    $: Observable<MyDocument<DocType, DocMethods>>;
    $$: Signal<MyDocument<DocType, DocMethods>>;
    lastData: DocType;
    key: string | number;

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        data: DocType
    ) {
        this.$ = this.subject.asObservable();
        this.$$ = this.collection.reactivity.fromObservable(this.$, data);
        this.subject.next(this);
        this.lastData = data;
        this.key = (data as any)[this.collection.primaryKey];

        Object.keys(this.lastData as any).forEach(key => {
            Object.defineProperty(this, key, {
                get: () => (this.lastData as any)[key]
            });
        });

        if (this.collection.methods) {
            Object.assign(this, this.collection.methods);
        }

        this.collection.$.pipe(
                map(docs => docs.find(doc =>
                    doc.key === this.key
                )),
                filter(doc => !!doc)
            ).subscribe(doc => {
                if (doc) {
                    this.lastData = doc?.lastData;
                    this.subject.next(this);
                }
            });
    }

    async patch(newDoc: any) {
        //TODO:
    }

    async remove() {
        //TODO: 
    }
}