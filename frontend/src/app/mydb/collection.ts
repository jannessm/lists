import { CollectionMethods, QueryOptions, SortCriterias } from "./types/database";
import { MyReactivityFactory } from "./types/interfaces";
import { Observable,  filter, map } from "rxjs";
import { MyDocument } from "./document";
import { MyQuery, MyQuerySingle } from "./query";
import { defaultConflictHandler } from "./conflict-handler";
import { ConflictHandler } from "./types/replication";
import { QueryObject } from "./types/classes";
import { MyDatabase } from "./database";

export class MyCollection<DocType, DocMethods, Reactivity> {
    private lastCheckpoint?: unknown;
    $: Observable<MyDocument<DocType, DocMethods>[]>;

    private conflictHandler!: ConflictHandler;

    constructor(private db: MyDatabase,
                private tableName: string,
                public primaryKey: string,
                public reactivity: MyReactivityFactory,
                public methods?: CollectionMethods,
                conflictHandler?: ConflictHandler
    ) {
        this.$ = this.db.$.pipe(
            filter(changes => changes.collection == this.tableName),
            map(changes => changes.changes)
        );
        
        if (!conflictHandler) {
            this.conflictHandler = defaultConflictHandler;
        }
    }

    get $$(): Reactivity {
        return this.reactivity.fromObservable(
            this.$,
            []
        );
    }

    get table() {
        return this.db.dexie.table(this.tableName);
    }
    get replicationTable() {
        return this.db.dexie.table(this.tableName + '_replication');
    }
    get masterTable() {
        return this.db.dexie.table(this.tableName + '_master_states');
    }

    find(query?: QueryOptions): MyQuery<DocType, DocMethods> {
        let req: QueryObject;
        if (query) {
            req = this.buildQuery(query);
        } else {
            req = {
                filter: (doc: any) => true,
                query: () => this.table.toArray()
            }
        }
        return new MyQuery<DocType, DocMethods>(this, req);
    }

    findOne(query?: QueryOptions): MyQuerySingle<DocType, DocMethods> {
        let req: QueryObject;
        if (query) {
            req = this.buildQuery(query, true);
        } else {
            req = {
                filter: (doc: any) => true,
                query: () => this.table.toCollection().first()
            }
        }
        
        return new MyQuerySingle<DocType, DocMethods>(this, req);
    }

    async insert(doc: any) {
        Object.assign(doc, {'touched': true});
        this.table.add(doc);
    }

    async remoteBulkAdd(docs: any[]) {
        // add new docs to mastertable and "forks"
        //   if doc exists in forks -> resolve err and add again
        await this.table.bulkAdd(docs).catch(async (err) => {
            const bulk = [];
            for (const [pos, error] of Object.entries(err.failuresByPos)) {
                if (!(error as any).message.includes('Key already exists')) {
                    // console.error(error);
                }
                const trueMaster = docs[parseInt(pos)];
                const assumedMaster = await this.masterTable.get(
                    {[this.primaryKey]: trueMaster[this.primaryKey]}
                );
                const forkState = await this.table.get(
                    {[this.primaryKey]: trueMaster[this.primaryKey]}
                );

                bulk.push(this.conflictHandler(forkState, assumedMaster, trueMaster));
            }

            if (bulk.length > 0) {
                await this.table.bulkPut(bulk);
            }
        });
        
        // update masterstates
        await this.masterTable.bulkPut(docs);
        
        // emit changes
        const updatedIds = docs.map(doc => doc[this.primaryKey]);
        const newDocs = await this.table.bulkGet(updatedIds);
        this.db.next(this.tableName, newDocs.map(doc => new MyDocument<DocType, DocMethods>(this, doc)));
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

    buildQuery(query: QueryOptions, single = false): QueryObject {
        const _this = this;
        return {
            filter: function(doc: any) {
                if (query.selector) {
                    return Object.entries(query.selector).reduce((carry, val) => {
                        const key = val[0];
                        const value = val[1];
    
                        return carry || doc[key] === value;
                    }, false);
                }
                return true;
            },
            query: async function () {
                let collection = _this.table.toCollection();

                collection = collection.filter(this.filter);

                const arr = await collection.toArray();

                if (single) {
                    return new MyDocument<DocType, DocMethods>(_this, arr[0]);
                }

                if (query.sort) {
                    arr.sort(recursiveSort(query.sort));
                }
                return arr.map(data => new MyDocument<DocType, DocMethods>(_this, data));
            },
        };
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