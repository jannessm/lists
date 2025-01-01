import { BehaviorSubject, Observable, Subject } from "rxjs";
import { MyCollection } from "./collection";
import { MyDocument } from "./document";
import { QueryObject } from "./types/classes";

export class MyQuerySingle<DocType, DocMethods> {
    private subject = new Subject<MyDocument<DocType, DocMethods>>();
    lastResult!: MyDocument<DocType, DocMethods>;

    constructor(
        private collection: MyCollection<DocType, DocMethods>,
        private query: QueryObject
    ) {
        this.update();

        this.collection.$.subscribe(() => {
                this.update();
            });
    }

    get $(): Observable<MyDocument<DocType, DocMethods>> {
        return this.subject.asObservable();
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
        private collection: MyCollection<DocType, DocMethods>,
        private query: QueryObject
    ) {
        this.collection.$.subscribe(() => {
                this.update();
            });
        
        this.update();

    }

    get $(): Observable<MyDocument<DocType, DocMethods>[]> {
        return this.subject.asObservable();
    }

    private update() {
        return this.query.query().then(docs => {
            this.subject.next(docs);
        });
    }

    patch(patch: any) {
        this.subject.value.forEach(doc => doc.patch(patch));
    }

    async bulkPatch(patch: any) {
        await this.update();

        if (!this.subject.value) {
            return;
        }

        return this.collection.bulkUpdate(this.subject.value, patch);
    }

    async remove() {
        await this.update();

        return this.bulkPatch({'_deleted': true});
    }
}