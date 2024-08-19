import { Observable } from "rxjs";
import { MyCollection } from "./collection";
import { Checkpoint, MyPushRow } from "./common";

export type MyReplicationOptions = {
    replicationIdentifier: string;
    collection: MyCollection;
    pull: MyPullOptions;
    push: MyPushOptions;
}

export type MyPullOptions = {
    handler: MyPullHandler;
    stream$: Observable<MyPullData | 'RESYNC'>;
    modifier?: MyDocumentModifier;
};

export type MyPullHandler = (checkpoint: unknwon, batchSize: number) => Promise<MyPullData>;
export type MyPullData = {
    documents: any[];
    checkpoint: Checkpoint;
};

export type MyPushOptions = {
    handler: MyPushHandler;
    modifier?: MyDocumentModifier;
};

export type MyPushHandler = (rows: MyPushRow[]) => Promise<any[]>;

export type MyDocumentModifier = (doc: unknown) => unknown;

export type ConflictHandler = (fork: any, assumedMaster: any, trueMaster: any) => any;