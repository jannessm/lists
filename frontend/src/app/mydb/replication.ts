import { Observable, Subject, Subscription } from "rxjs";
import { MyCollection } from "./types/collection";
import { MyPullHandler, MyPullOptions, MyPushHandler, MyPushOptions, MyReplicationOptions } from "./types/replication";

export async function replicateCollection(options: MyReplicationOptions): Promise<Replicator> {
    const replicator = new Replicator(
        options.replicationIdentifier,
        options.collection,
        options.pull,
        options.push
    );

    return replicator;
}

export class Replicator {
    private stream$: Subscription | undefined;
    public remoteEvents$ = new Subject<unknown>();

    constructor (
        private identifier: string,
        private collection: MyCollection<unknown, unknown, unknown>,
        private pullOptions: MyPullOptions,
        private pushOptions: MyPushOptions,
    ) {
        this.pull().then(() => this.startStream());
    }

    public async pull() {
        while(true) {
            const lastCheckpoint = await this.collection.getLastCheckpoint()
            const newDocs = await this.pullOptions.handler(
                lastCheckpoint, 100
            );

            let docs = newDocs.documents;
            if (docs.length > 0) {
                if (this.pullOptions.modifier) {
                    docs = newDocs.documents.map(this.pullOptions.modifier)
                }
                await this.collection.masterBulkAdd(docs);
                await this.collection.setCheckpoint(newDocs.checkpoint);
            } else {
                break;
            }
        }
    }

    public startStream() {
        this.stream$ = this.pullOptions.stream$.subscribe(docs => {
            if (docs === 'RESYNC') {
                this.pull();
                return;
            }
            
            if (this.pullOptions.modifier) {
                docs = docs.map(this.pullOptions.modifier);
            }
            this.remoteEvents$.next(docs);
            this.collection.masterBulkAdd(docs);
        });
    }

    public destroy() {
        this.stream$?.unsubscribe();
        this.remoteEvents$.complete();
    }
}