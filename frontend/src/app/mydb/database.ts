import Dexie from "dexie";
import { AddCollectionsOptions, CreateDatabaseOptions } from "./types/database";
import { MyReactivityFactory } from "./types/interfaces";
import { DexieSchema } from "./types/schema";
import { MyCollection } from "./collection";
import { Observable, Subject } from "rxjs";
import { MyDocument } from "./types/classes";
import { DatabaseChanges } from "./types/common";
import { environment } from "../../environments/environment";

export function createMyDatabase(options: CreateDatabaseOptions): MyDatabase {
    Dexie.debug = environment.dexieDebugMode;
    return new MyDatabase(options.name, options.reactivity);
}

export class MyDatabase {

    public dexie: Dexie;
    public schema?: AddCollectionsOptions;
    private initialied = false;

    private changes = new Subject<DatabaseChanges>();
    $: Observable<DatabaseChanges>;

    constructor(name: string,
                public reactivity: MyReactivityFactory) {
        this.dexie = new Dexie(name);
        this.$ = this.changes.asObservable();
    }

    destroy() {
        this.changes.complete();
    }

    async addCollections(options: AddCollectionsOptions) {
        if (!this.initialied) {
            this.schema = options;
            this.dexie.version(1).stores(MyDatabase.getPrimaryKeysFromCollections(options));
    
            Object.keys(options).forEach(tableName => {
                const tableOptions = options[tableName];
                Object.defineProperty(this, tableName, {
                    get: () => new MyCollection(this,
                                                tableName,
                                                tableOptions.schema.primaryKey,
                                                this.reactivity,
                                                tableOptions.methods,
                                                tableOptions.conflictHandler)
                });
            });
            this.initialied = true;
        }
    }

    static getPrimaryKeysFromCollections(options: AddCollectionsOptions): DexieSchema {
        const schema: DexieSchema = { };
        
        Object.entries(options).forEach(val => {
            const key = val[0];
            const definition = val[1];

            schema[key] = [
                definition.schema.primaryKey,
                ...definition.schema.required,
                '_deleted', 'updatedAt', 'touched'
            ].join(',');

            schema[key + '_master_states'] = definition.schema.primaryKey;
            schema[key + '_replication'] = 'updatedAt';
        });
        return schema;
    }

    next(collection: string, changes: MyDocument<any, any>[], replicate = true) {
        console.log('new change', collection, changes);
        this.changes.next({
            collection,
            replicate,
            changes
        })
    }
}