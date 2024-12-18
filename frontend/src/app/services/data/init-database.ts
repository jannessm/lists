import { Injector, untracked } from "@angular/core";
import { toSignal } from '@angular/core/rxjs-interop';
import { ITEM_SCHEMA, itemsConflictHandler } from "../../mydb/types/list-item";
import { DATA_TYPE } from "../../mydb/types/graphql-types";
import { MyReactivityFactory } from "../../mydb/types/interfaces";
import { MyDatabase, createMyDatabase } from "../../mydb/database";
import { ME_SCHEMA } from "../../mydb/types/me";
import { LISTS_SCHEMA, listsConflictHandler } from "../../mydb/types/lists";
import { USERS_SCHEMA } from "../../mydb/types/users";
import { isValidUrl } from "../../pipes/linkify.pipe";

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

    await _create(injector).then(db => DB_INSTANCE = db);
}

async function _create(injector: Injector): Promise<MyDatabase> {
    console.log('DatabaseService: creating database..');

    /**
     * Add the Reactivity Factory so that we can get angular Signals
     * instead of observables.
     * @link https://rxdb.info/reactivity.html
     */
    const reactivityFactory: MyReactivityFactory = {
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


    const db = await createMyDatabase({
        name: 'lists-db',
        reactivity: reactivityFactory
    });
    console.log('DatabaseService: created database');

    return await addCollections(db);
}

export async function addCollections(db: MyDatabase): Promise<MyDatabase> {

    // create collections
    console.log('DatabaseService: create collections');
    await db.addCollections({
        [DATA_TYPE.ME]: {
            schema: ME_SCHEMA,
            methods: {
                hasLists: function(listId: string) {
                    return !!((this as any).lists.find((l: string) => l === listId));
                }
            }
        },
        [DATA_TYPE.USERS]: {
            schema: USERS_SCHEMA,
        },
        [DATA_TYPE.LISTS]: {
            schema: LISTS_SCHEMA,
            methods: {
                users: function() {
                    return [(this as any).createdBy, ...(this as any).sharedWith];
                },
                isCreated: function() {
                    return !!(this as any).updatedAt;
                }
            },
            conflictHandler: listsConflictHandler
        },
        [DATA_TYPE.LIST_ITEM]: {
            schema: ITEM_SCHEMA,
            methods: {
                links: function() {
                    const links: string[] = [];
                    const description = (this as any).description as string | null | undefined || '';

                    description.split('\n').forEach(line => {
                        line.split(' ').forEach(word => {
                            if (isValidUrl(word)) {
                                links.push(word);
                            }
                        })
                    });

                    return links;
                }
            },
            conflictHandler: itemsConflictHandler
        }
    });

    console.log('DatabaseService: created');

    return db;
}
