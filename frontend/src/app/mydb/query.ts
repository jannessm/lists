import { BehaviorSubject, Observable, Subject, filter, map } from "rxjs";
import { MyCollection } from "./collection";
import { Signal } from "@angular/core";
import { MyDocument } from "./document";
import { MyDocument as MyDocumentType, QueryObject } from "./types/classes";

export class MyQuerySingle<DocType, DocMethods> {
    private subject = new Subject<MyDocument<DocType, DocMethods>>();
    lastResult!: MyDocument<DocType, DocMethods>;

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        private query: QueryObject
    ) {
        this.update();

        this.collection.$.pipe(
                filter(docs => docs.reduce((carry, doc) =>
                    carry || this.query.filter(doc), false
                )),
                map(docs => docs.find(this.query.filter))
            )
            .subscribe(doc => {
                if (doc) {
                    this.lastResult = doc;
                    this.subject.next(doc);
                }
            });
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
        this.query.query().then(doc => {
            this.lastResult = doc;
            this.subject.next(doc);
        });
    }
    
    patch(doc: any) {
        this.lastResult.patch(doc);
    }

}

export class MyQuery<DocType, DocMethods> {
    private subject = new BehaviorSubject<MyDocument<DocType, DocMethods>[]>([]);

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        private query: QueryObject
    ) {
        this.collection.$.pipe(
                filter(docs => docs.reduce((carry, doc) =>
                    carry || this.query.filter(doc), false
                ))
            )
            .subscribe(docs => {
                this.update();
            });
        
        this.update();

    }

    get $(): Observable<MyDocument<DocType, DocMethods>[]> {
        return this.subject.asObservable();
    }

    get $$(): Signal<MyDocumentType<DocType, DocMethods>[]> {
        return this.collection.reactivity.fromObservable(
            this.$,
            this.subject.value
        );
    }

    private update() {
        this.query.query().then(docs => {
            this.subject.next(docs);
        });
    }

    patch(patch: any) {
        this.subject.value.forEach(doc => doc.patch(patch));
    }

    remove() {
        this.subject.value.forEach(doc => doc.remove());
    }
}