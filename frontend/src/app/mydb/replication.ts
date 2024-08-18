import { Subject, Subscription } from "rxjs";
import { MyPullOptions, MyPushOptions, MyReplicationOptions } from "./types/replication";
import { MyCollection } from "./collection";

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
                    docs = docs.map(this.pullOptions.modifier)
                }
                await this.collection.remoteBulkAdd(docs);
                await this.collection.setCheckpoint(newDocs.checkpoint);
            } else {
                break;
            }
        }

        // console.log(await this.collection.table.toCollection()
        //     .filter(doc => doc.touched)
        //     .toArray()
        // );
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
            this.collection.remoteBulkAdd(docs);
        });
    }

    public destroy() {
        this.stream$?.unsubscribe();
        this.remoteEvents$.complete();
    }
}