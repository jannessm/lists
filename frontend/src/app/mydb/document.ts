import { Signal } from "@angular/core";
import { MyCollection } from "./collection";
import { Observable, Subject, filter, map } from "rxjs";

export class MyDocument<DocType, DocMethods> {
    private subject: Subject<MyDocument<DocType, DocMethods>> = new Subject();
    $: Observable<MyDocument<DocType, DocMethods>>;
    $$: Signal<MyDocument<DocType, DocMethods>>;
    key: string | number;
    isClassObject = true;

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        private lastData: DocType
    ) {
        this.$ = this.subject.asObservable();
        this.subject.next(this);
        this.$$ = this.collection.reactivity.fromObservable(this.$, this);
        this.key = (this.lastData as any)[this.collection.primaryKey];

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

    async patch(patch: any) {
        // create a deep copy to not modify doc instance
        const newDoc = JSON.parse(JSON.stringify(this.lastData));
        Object.assign(newDoc, patch);
        return this.collection.update(newDoc);
    }

    async remove() {
        return this.patch({'_deleted': true});
    }
}