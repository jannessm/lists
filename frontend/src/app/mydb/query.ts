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
    /** In-memory cache keyed by primary-key value. */
    private cache = new Map<string | number, MyDocument<DocType, DocMethods>>();

    constructor(
        private collection: MyCollection<DocType, DocMethods>,
        private query: QueryObject
    ) {
        this.collection.$.subscribe(emitted => {
            if (emitted.length === 0) {
                // Structural change (bulk add, rollback, etc.) — rebuild from DB.
                this.fullScan();
            } else {
                // Patch/update: apply the changed documents to the cache and
                // re-emit without hitting IndexedDB.
                this.patchCache(emitted);
            }
        });

        this.fullScan();
    }

    get $(): Observable<MyDocument<DocType, DocMethods>[]> {
        return this.subject.asObservable();
    }

    private fullScan() {
        return this.query.query().then(docs => {
            this.cache.clear();
            (docs as MyDocument<DocType, DocMethods>[]).forEach(doc => {
                this.cache.set(doc.key, doc);
            });
            this.subject.next([...this.cache.values()]);
        });
    }

    private patchCache(emitted: any[]) {
        const pk = this.collection.primaryKey;
        let changed = false;

        emitted.forEach(raw => {
            const key = raw[pk];
            if (this.query.filter(raw)) {
                // Update or insert into cache
                this.cache.set(key, new MyDocument<DocType, DocMethods>(this.collection, raw));
                changed = true;
            } else if (this.cache.has(key)) {
                // Doc no longer matches filter (e.g. deleted) — remove from cache
                this.cache.delete(key);
                changed = true;
            }
        });

        if (changed) {
            this.subject.next([...this.cache.values()]);
        }
    }

    patch(patch: any) {
        this.subject.value.forEach(doc => doc.patch(patch));
    }

    async bulkPatch(patch: any) {
        await this.fullScan();

        if (!this.subject.value) {
            return;
        }

        return this.collection.bulkUpdate(this.subject.value, patch);
    }

    async remove() {
        await this.fullScan();

        return this.bulkPatch({'_deleted': true});
    }
}