import Dexie, { Table } from "dexie";
import { MyReactivityFactory } from "./interfaces";
import { JsonSchema } from "./schema";
import { MyCollection } from "../collection";

export type MyDatabase<Collections, reactivity> = MyDatabaseBase<reactivity> & Collections;

export type MyDatabaseBase<reactivity> = {
    private reactivity: MyReactivityFactory<reactivity>;
    private db: Dexie;
    private schema?: AddCollectionsOptions;
};

export interface CreateDatabaseOptions {
    name: string;
    reactivity: MyReactivityFactory;
}

export interface AddCollectionsOptions {
    [name: string]: CollectionOptions;
}

export interface CollectionOptions {
    schema: JsonSchema;
    methods?: CollectionMethods;
}

export type CollectionMethods = {
    [key: string]: () => any;
}

export type QueryOptions = {
    selector?: {
        [key: string]: any;
    };
    sort?: SortCriterias;
}

export type SortCriterias = { [key: string]: 'asc' | 'desc' }[];