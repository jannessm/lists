import Dexie from "dexie";
import { AddCollectionsOptions, CollectionOptions, CreateDatabaseOptions } from "./types/database";
import { MyReactivityFactory } from "./types/interfaces";
import { DexieSchema } from "./types/schema";
import { MyCollection } from "./collection";

export function createMyDatabase(options: CreateDatabaseOptions): MyDatabase {
    return new MyDatabase(options.name, options.reactivity);
}

export class MyDatabase {

    private db: Dexie;
    private schema?: AddCollectionsOptions;
    private initialied = false;

    constructor(name: string,
                public reactivity: MyReactivityFactory) {
        this.db = new Dexie(name);
    }

    async addCollections(options: AddCollectionsOptions) {
        if (!this.initialied) {
            this.db.version(1).stores(MyDatabase.getPrimaryKeysFromCollections(options));
    
            Object.keys(options).forEach(tableName => {
                Object.defineProperty(this, tableName, {
                    get: () => new MyCollection(this.db,
                                                tableName,
                                                this.reactivity,
                                                options[tableName].methods)
                });
            });
            this.initialied = true;
        }
    }

    static getPrimaryKeysFromCollections(options: AddCollectionsOptions): DexieSchema {
        const schema: DexieSchema = {};
        Object.entries((key: string, definition: CollectionOptions) => {
            schema[key] = [definition.schema.primaryKey, ...definition.schema.required].join(',');
        });
        return schema;
    }
}