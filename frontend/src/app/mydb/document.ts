import { Signal } from "@angular/core";
import { MyCollection } from "./collection";
import { Observable, Subject, filter } from "rxjs";

export class MyDocument<DocType, DocMethods> {
    private subject: Subject<unknown> = new Subject();
    $: Observable<unknown>;
    $$!: Signal<unknown>;

    constructor(
        private collection: MyCollection<DocType, DocMethods, unknown>,
        private data: any
    ) {
        this.$ = this.subject.asObservable();
        this.$$ = this.collection.reactivity.fromObservable(this.$, data);
        this.subject.next(data);

        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get: () => this.data[key]
            });
        });

        if (this.collection.methods) {
            Object.assign(this, this.collection.methods);
        }

        this.collection.$.pipe(filter(event => {
            return true;
            //TODO:
        })).subscribe();
    }

    async patch(newDoc: any) {
        //TODO:
    }

    async remove() {
        //TODO: 
    }
}