import { Signal } from "@angular/core";
import { MyCollection } from "./collection";
import { Observable, Subject } from "rxjs";
import { CollectionMethods } from "./types/database";

export class MyDocument {
    private subject: Subject<unknown> = new Subject();
    private lastDoc!: unknown;
    $: Observable<unknown>;
    $$!: Signal<unknown>;

    constructor(
        methods: CollectionMethods | undefined,
        private collection: MyCollection,
        private request: Promise<object>
    ) {
        this.$ = this.subject.asObservable();
        request.then(doc => {
            this.subject.next(doc);
            this.$$ = this.collection.reactivity.fromObservable(this.$, doc);
            this.lastDoc = doc;
        });

        if (methods) {
            Object.assign(this, methods);
        }
    }

    async patch(newDoc: any) {
        //TODO: 
        this.collection.primaryKey
    }
}