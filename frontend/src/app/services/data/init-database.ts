import { Injector, Signal, untracked } from "@angular/core";
import { RxDatabase, RxReactivityFactory, createRxDatabase, defaultConflictHandler } from "rxdb";
import { environment } from "../../../environments/environment";
import { toSignal } from '@angular/core/rxjs-interop';
import { RxMeCollection, ME_SCHEMA } from "../../../models/rxdb/me";
import { RxListsCollection, LISTS_SCHEMA } from "../../../models/rxdb/lists";
import { RxItemCollection, itemsConflictHandler, ITEM_SCHEMA } from "../../../models/rxdb/list-item";
import { DATA_TYPE } from "../../../models/rxdb/graphql-types";

export type RxListsCollections = {
    me: RxMeCollection,
    lists: RxListsCollection,
    items: RxItemCollection
};
export type RxListsDatabase = RxDatabase<RxListsCollections, unknown, unknown, Signal<unknown>>;

export let DB_INSTANCE: any;

/**
 * This is run via APP_INITIALIZER in app.module.ts
 * to ensure the database exists before the angular-app starts up
 */
export async function initDatabase(injector: Injector) {
    if (!injector) {
        throw new Error('initDatabase() injector missing');
    }

    await _create(injector).then(db => DB_INSTANCE = db);
}

async function _create(injector: Injector): Promise<RxDatabase> {
    environment.addRxDBPlugins();

    console.log('DatabaseService: creating database..');

    /**
     * Add the Reactivity Factory so that we can get angular Signals
     * instead of observables.
     * @link https://rxdb.info/reactivity.html
     */
    const reactivityFactory: RxReactivityFactory<Signal<any>> = {
        fromObservable(obs, initialValue: any) {
            return untracked(() =>
                toSignal(obs, {
                    initialValue,
                    injector,
                    rejectErrors: true
                })
            );
        }
    }


    const db = await createRxDatabase({
        name: 'lists-db',
        storage: environment.getRxStorage(),
        multiInstance: true,
        reactivity: reactivityFactory
    });
    console.log('DatabaseService: created database');

    return await addCollections(db);
}

export async function addCollections(db: any): Promise<RxDatabase> {

    // create collections
    console.log('DatabaseService: create collections');
    await db.addCollections({
        [DATA_TYPE.ME]: {
            schema: ME_SCHEMA,
        },
        [DATA_TYPE.LISTS]: {
            schema: LISTS_SCHEMA,
            methods: {
                users: function() {
                    return [(this as any).createdBy, ...(this as any).sharedWith];
                }
            },
            conflictHandler: defaultConflictHandler
        },
        [DATA_TYPE.LIST_ITEM]: {
            schema: ITEM_SCHEMA,
            // conflictHandler: defaultConflictHandler
            conflictHandler: itemsConflictHandler
        }
    });

    console.log('DatabaseService: created');

    return db as any;
}