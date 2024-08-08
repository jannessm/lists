import Dexie from "dexie";
import { CollectionMethods } from "./types/database";
import { MyReactivityFactory } from "./types/interfaces";

export class MyCollection {

    constructor(public db: Dexie,
                private tableName: string,
                private reactivity: MyReactivityFactory,
                private methods?: CollectionMethods) {}

    async remove() {
        return this.db.table(this.tableName).clear();
    }
}