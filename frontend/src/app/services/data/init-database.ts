import { Injector, Signal, untracked } from "@angular/core";
import { RxDatabase, RxReactivityFactory, createRxDatabase } from "rxdb";
import { environment } from "../../../environments/environment";
import { toSignal } from '@angular/core/rxjs-interop';
import { RxMeCollection, meSchema } from "../../../models/rxdb/me";
import { RxListsCollection, defaultConflictHandler, listsSchema } from "../../../models/rxdb/lists";
import { RxItemsCollection, listItemSchema } from "../../../models/rxdb/list-item";
import { DATA_TYPE } from "../../../models/rxdb/graphql-types";

export type RxListsCollections = {
    me: RxMeCollection,
    lists: RxListsCollection,
    items: RxItemsCollection
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
        // multiInstance: true,
        reactivity: reactivityFactory
        // password: 'myLongAndStupidPassword' // no password needed
    });
    console.log('DatabaseService: created database');

    // create collections
    console.log('DatabaseService: create collections');
    await db.addCollections({
        [DATA_TYPE.ME]: {
            schema: meSchema,
        },
        [DATA_TYPE.LISTS]: {
            schema: listsSchema,
            methods: {
                users: function() {
                    return [(this as any).createdBy, ...(this as any).sharedWith];
                }
            },
            conflictHandler: defaultConflictHandler
        },
        [DATA_TYPE.LIST_ITEM]: {
            schema: listItemSchema,
            conflictHandler: defaultConflictHandler
        }
    });

    console.log('DatabaseService: created');

    return db as any;
}