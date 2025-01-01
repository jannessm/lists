import { Injector } from "@angular/core";
import { environment } from "../../../environments/environment";
import Dexie from "dexie";
import { DB_CONFIG } from "./db-config";
import { DexieSchema } from "../../mydb/types/schema";
import { AddCollectionsOptions } from "../../mydb/types/database";

export let DB_INSTANCE: any;

/**
 * This is run via APP_INITIALIZER in app.module.ts
 * to ensure the database exists before the angular-app starts up
 */
export async function initDatabase(injector: Injector) {
    if (!injector) {
        throw new Error('initDatabase() injector missing');
    }

    // remove old data
    if (!!localStorage.getItem('jwt')) {
        localStorage.clear();
        (await indexedDB.databases()).forEach(db => {
            if (db.name) {
                indexedDB.deleteDatabase(db.name);
            }
        });
    }

    Dexie.debug = environment.dexieDebugMode;
    const dexie = new Dexie('lists-db');

    dexie.version(1)
         .stores(getPrimaryKeysFromCollections(DB_CONFIG));
    
    DB_INSTANCE = dexie;
}

function getPrimaryKeysFromCollections(options: AddCollectionsOptions): DexieSchema {
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