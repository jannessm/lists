import Dexie from "dexie";
import { CollectionMethods, QueryOptions, SortCriterias } from "./types/database";
import { MyReactivityFactory } from "./types/interfaces";
import { Observable, Subject } from "rxjs";
import { MyDocument } from "./document";
import { MyQuery, MyQuerySingle } from "./query";

export class MyCollection<DocType, DocMethods, Reactivity> {
    changes: Subject<MyDocument<DocType, DocMethods>[]> = new Subject();
    $: Observable<MyDocument<DocType, DocMethods>[]>;
    $$!: Reactivity;
    private lastCheckpoint?: unknown;

    constructor(public db: Dexie,
                private tableName: string,
                public primaryKey: string,
                public reactivity: MyReactivityFactory,
                public methods?: CollectionMethods
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

    find(query?: QueryOptions): MyQuery<DocType, DocMethods> {
        let req: () => any = () => this.table.toArray();
        if (query) {
            req = this.buildQuery(query);
        } else {
            this.table.toArray();
        }
        return new MyQuery<DocType, DocMethods>(this, req);
    }

    findOne(query?: QueryOptions): MyQuerySingle<DocType, DocMethods> {
        let req: () => any = () => this.table.toCollection().first();
        if (query) {
            req = this.buildQuery(query, true);
        }
        return new MyQuerySingle<DocType, DocMethods>(this, req);
    }

    async insert(doc: any) {
        Object.assign(doc, {'touched': true});
        this.table.add(doc);
    }

    async remoteBulkAdd(docs: unknown[]) {
        // add new docs to mastertable and "forks"
        //   if doc exists in forks -> resolve err and add again
        await this.table.bulkAdd(docs).catch((errs) => {

            console.log(errs);
            //TODO: resovle errors
        });
        // update masterstates
        return this.masterTable.bulkPut(docs);
    }

    async getAssumedMaster(key: string) {
        return this.masterTable.get({[this.primaryKey]: key});
    }
    
    async remove() {
        return this.table.clear();
    }

    async getLastCheckpoint(): Promise<unknown> {
        if (!this.lastCheckpoint) {
            const lastCheckpoints = await this.replicationTable.toArray();
    
            if (lastCheckpoints.length > 0) {
                return lastCheckpoints[0];
            } else {
                return undefined;
            }
        }
        return this.lastCheckpoint;
    }

    async setCheckpoint(checkpoint: unknown): Promise<undefined> {
        this.replicationTable.clear();
        this.replicationTable.put(checkpoint);
        this.lastCheckpoint = checkpoint;
    }

    buildQuery(query: QueryOptions, single = false) {
        return async () => {
            let collection = this.table.toCollection();

            // only supports selector with key => val
            if (query.selector) {
                Object.entries(query.selector).forEach(val => {
                    const key = val[0];
                    const value = val[1];

                    collection = collection.filter(doc => doc[key] === value)
                });
            }

            const arr = await collection.toArray();
            if (query.sort) {
                arr.sort(recursiveSort(query.sort));
            }

            if (single) {
                return arr[0];
            }
    
            return arr;
        }
    }
}

function recursiveSort(criterias: SortCriterias) {
    return (a: any, b: any) => {

        return criterias.reduce((carry, criteria) => {
            if (carry != 0) {
                return carry;
            }
            
            const key = Object.keys(criteria)[0];
            const direction = criteria[key] === 'asc' ? 1 : -1;
            if (a[key] > b[key]) {
                return 1 * direction;
            } else if (a[key] < b[key]) {
                return -1 * direction;
            }

            return carry;
        }, 0);
    }
}