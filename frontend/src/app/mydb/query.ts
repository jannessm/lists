import { Observable, Subject, filter } from "rxjs";
import { MyCollection } from "./collection";
import { Signal } from "@angular/core";
import { MyDocument } from "./document";
import { MyDocument as MyDocumentType } from "./types/classes";

export class MyQuerySingle<DocType, DocMethods> {
    private subject = new Subject<MyDocument<DocType, DocMethods>>();
    lastResult!: MyDocument<DocType, DocMethods>;

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        private query: () => Promise<any>
    ) {
        this.update();

        this.collection.$.subscribe(() => this.update());
    }

    get $(): Observable<MyDocument<DocType, DocMethods>> {
        return this.subject.asObservable();
    }

    get $$(): Signal<MyDocumentType<DocType, DocMethods>> {
        return this.collection.reactivity.fromObservable(
            this.$,
            this.lastResult
        );
    }

    private update() {
        this.query().then(doc => {
            const newDoc = new MyDocument<DocType, DocMethods>(this.collection, doc);
            this.lastResult = newDoc;
            this.subject.next(newDoc);
        });
    }
    
    patch(doc: any) {
        this.lastResult.patch(doc);
    }

}

export class MyQuery<DocType, DocMethods> {
    private subject = new Subject<MyDocument<DocType, DocMethods>[]>();
    lastResult!: MyDocument<DocType, DocMethods>[];

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        private query: () => Promise<any[]>
    ) {
        this.query().then(docs => {
            const newDocs = docs.map(doc => new MyDocument<DocType, DocMethods>(this.collection, doc));
            this.lastResult = newDocs;
            this.subject.next(newDocs);
        })
    }

    get $(): Observable<MyDocument<DocType, DocMethods>[]> {
        return this.subject.asObservable();
    }

    get $$(): Signal<MyDocumentType<DocType, DocMethods>[]> {
        return this.collection.reactivity.fromObservable(
            this.$,
            this.lastResult
        );
    }

    patch(patch: any) {
        this.lastResult.forEach(doc => doc.patch(patch));
    }

    remove() {
        this.lastResult.forEach(doc => doc.remove());
    }
}