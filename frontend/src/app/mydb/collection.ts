import { CollectionMethods, QueryOptions, SortCriterias } from "./types/database";
import { MyDocument } from "./document";
import { defaultConflictHandler } from "./conflict-handler";
import { ConflictHandler } from "./types/replication";
import { QueryObject } from "./types/classes";
import { MyQuery, MyQuerySingle } from "./query";
import { EventEmitter } from "@angular/core";
import Dexie from "dexie";
import { JsonSchema } from "./types/schema";

export class MyCollection<DocType, DocMethods> {
    private lastCheckpoint?: unknown;
    $ = new EventEmitter<MyDocument<DocType, DocMethods>[]>();
    replication$ = new EventEmitter<void>();
    
    public primaryKey!: string;

    private conflictHandler!: ConflictHandler;

    constructor(private dexie: Dexie,
                private tableName: string,
                public schema: JsonSchema,
                public methods?: CollectionMethods,
                conflictHandler?: ConflictHandler
    ) { 
        if (!conflictHandler) {
            this.conflictHandler = defaultConflictHandler;
        } else {
            this.conflictHandler = conflictHandler;
        }

        this.primaryKey = schema.primaryKey;
    }

    get table() {
        return this.dexie.table(this.tableName);
    }
    get replicationTable() {
        return this.dexie.table(this.tableName + '_replication');
    }
    get masterTable() {
        return this.dexie.table(this.tableName + '_master_states');
    }

    find(query?: QueryOptions): MyQuery<DocType, DocMethods> {
        let req: QueryObject;
        if (query) {
            req = this.buildQuery(query);
        } else {
            req = {
                filter: (doc: any) => !doc._deleted,
                query: async () => {
                    const table = await this.table.toArray();
                    return table.map(doc => {
                        return new MyDocument<DocType, DocMethods>(this, doc);
                    });
                }
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
                query: async () => {
                    const doc = await this.table.toCollection().first();
                    if (doc)
                        return new MyDocument<DocType, DocMethods>(this, doc);
                    return undefined;
                }
            }
        }
        
        return new MyQuerySingle<DocType, DocMethods>(this, req);
    }

    async insert(doc: any) {
        // operate on copy only
        const newDoc = JSON.parse(JSON.stringify(doc));
        Object.assign(newDoc, {touched: true});
        await this.table.add(newDoc);

        this.$.next([doc]);
        this.replication$.next();
    }

    async markUntouched(docs: any[]) {
        const changes = docs.map((doc: any) => {
            return {
                key: doc[this.primaryKey],
                changes: {touched: false}
            };
        });
        await this.table.bulkUpdate(changes);

        const keys = docs.map(doc => doc[this.primaryKey]);
        let newDocs = await this.table.bulkGet(keys);
        newDocs = newDocs.map(doc => {
            delete doc['touched'];
            return doc;
        });

        this.updateMasterState(newDocs);

        this.$.next(newDocs);
        // no replication since it is triggered by replication
    }

    async update(newDoc: any) {
        // operate on copy only
        newDoc = JSON.parse(JSON.stringify(newDoc));
        Object.assign(newDoc, {touched: true});

        await this.table.put(newDoc);

        this.$.next([newDoc]);
        this.replication$.next();
    }

    async bulkUpdate(
        docs: MyDocument<DocType, DocMethods>[],
        patch: {key: string, changes: any}
    ) {
        Object.assign(patch, {touched: true});

        const updates = docs.map(doc => {
            return {
                key: doc.key,
                changes: patch
            };
        });
        
        await this.table.bulkUpdate(updates);

        const keys = docs.map((doc: any) => doc[this.primaryKey]);
        const newDocs = await this.table.bulkGet(keys);
        
        this.$.next(newDocs);
        this.replication$.next();
    }

    async remoteBulkAdd(docs: any[]) {
        // add new docs to mastertable and "forks"
        //   if doc exists in forks -> resolve err and add again
        try {
            await this.table.bulkAdd(docs);
        } catch (err: any) {
            const bulk = [];
            for (const [pos, error] of Object.entries(err.failuresByPos)) {
                if (!(error as any).message.includes('Key already exists')) {
                    console.error(error);
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
        }
        
        this.$.next([]);
    }

    async updateMasterState(docs: any[]) {
        await this.masterTable.bulkPut(docs);
    }

    async getAssumedMaster(key: string) {
        return this.masterTable.get({[this.primaryKey]: key});
    }
    
    remove() {
        return Promise.all([
            this.table.clear(),
            this.masterTable.clear(),
            this.replicationTable.clear()
        ]);
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
                // selector
                if (query.selector && !doc._deleted) {
                    return Object.entries(query.selector).reduce((carry, val) => {
                        const key = val[0];
                        const value = val[1];
                        
                        if (value instanceof Array) {
                            return carry && value.reduce((c, v) => doc[key] === v || c, false);
                        }

                        return carry && doc[key] === value;
                    }, true);
                
                // neqSelector
                } else if (query.neqSelector && !doc._deleted) {
                    return Object.entries(query.neqSelector).reduce((carry, val) => {
                        const key = val[0];
                        const value = val[1];
    
                        if (value instanceof Array) {
                            return carry && value.reduce((c, v) => doc[key] !== v && c, true);
                        }
                        return carry && doc[key] !== value;
                    }, true);
                }
                return !doc._deleted;
            },
            query: async function () {
                let collection = _this.table.toCollection();

                collection = collection.filter(this.filter);

                const arr = await collection.toArray();

                if (single && !!arr[0]) {
                    return new MyDocument<DocType, DocMethods>(_this, arr[0]);
                } else if (!arr[0]) {
                    return undefined;
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