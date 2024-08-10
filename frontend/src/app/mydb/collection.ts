import Dexie from "dexie";
import { CollectionMethods } from "./types/database";
import { MyReactivityFactory } from "./types/interfaces";
import { WritableSignal, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { MyDocument } from "./document";

export class MyCollection {
    changes: Subject<unknown[]> = new Subject();
    $: Observable<unknown[]>;
    $$!: WritableSignal<unknown[]>;
    private lastCheckpoint?: unknown;

    private queriedDocs: {[key: string]: Subject<MyDocument>} = {};

    constructor(public db: Dexie,
                private tableName: string,
                public primaryKey: string,
                public reactivity: MyReactivityFactory,
                private methods?: CollectionMethods
    ) {
        this.$ = this.changes.asObservable();
        this.table.toArray().then(arr => this.$$ = reactivity.fromObservable(this.$, arr));
    }

    get table() {
        return this.db.table(this.tableName);
    }
    get replicationTable() {
        return this.db.table(this.tableName + '_replication');
    }
    get masterTable() {
        return this.db.table(this.tableName + '_master_states');
    }

    findOne() {
        const req = this.table.toCollection().first();
        return new MyDocument(this.methods, this, req);
    }

    async insert(doc: any) {
        
    }

    async masterBulkAdd(docs: unknown[]) {
        // add new docs to mastertable and "forks"
        // add existing docs to mastertable and to forks only if new doc is newer than the forks
        await this.table.bulkAdd(docs).catch((errs) => {
            console.log(errs);
        });
        return this.masterTable.bulkPut(docs);
    }
    
    async remove() {
        return this.table.clear();
    }

    async getLastCheckpoint(): Promise<unknown> {
        if (!this.lastCheckpoint) {
            const lastCheckpoints = await this.replicationTable.toArray();
    
            if (lastCheckpoints.length > 0) {
                return lastCheckpoints[0];
            }
        }
        return this.lastCheckpoint;
    }

    async setCheckpoint(checkpoint: unknown): Promise<undefined> {
        this.replicationTable.put(checkpoint);
        this.lastCheckpoint = checkpoint;
    }
}