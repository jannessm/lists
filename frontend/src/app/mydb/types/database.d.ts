import Dexie, { Table } from "dexie";
import { MyReactivityFactory } from "./interfaces";
import { JsonSchema } from "./schema";
import { MyCollection } from "../collection";
import { MyDocument } from "../document";
import { MyMeCollection } from "./me";
import { MyListsCollection } from "./lists";
import { MyItemCollection } from "./list-item";
import { MyUsersCollection } from "./users";

export type MyListsCollections = {
    me: MyMeCollection,
    users: MyUsersCollection,
    lists: MyListsCollection,
    items: MyItemCollection
};

export interface CreateDatabaseOptions {
    name: string;
}

export interface AddCollectionsOptions {
    [name: string]: CollectionOptions;
}

export interface CollectionOptions {
    schema: JsonSchema;
    methods?: CollectionMethods;
    conflictHandler?: (forkState: any, assumedMasterState: any, trueMasterState: any) => any;
}

export type CollectionMethods = {
    [key: string]: (...any) => any;
}

export type QueryOptions = {
    selector?: {
        [key: string]: any;
    };
    neqSelector?: {
        [key: string]: any;
    };
    sort?: SortCriterias;
}

export type SortCriterias = { [key: string]: 'asc' | 'desc' }[];