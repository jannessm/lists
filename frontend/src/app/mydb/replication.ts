import { Subject, Subscription, filter } from "rxjs";
import { MyPullOptions, MyPushOptions, MyReplicationOptions } from "./types/replication";
import { MyCollection } from "./collection";
import { MyDocument } from "./types/classes";
import { MyPushRow } from "./types/common";

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
    private localEvents$: Subscription;
    public remoteEvents$ = new Subject<unknown>();

    constructor (
        private identifier: string,
        private collection: MyCollection<unknown, unknown, unknown>,
        private pullOptions: MyPullOptions,
        private pushOptions?: MyPushOptions,
    ) {
        this.localEvents$ = this.collection.replication$.subscribe(docs => {
            this.push(docs);
        });
        
        this.pull().then(() => this.startStream());
    }

    public remove() {
        return this.collection.replicationTable.clear();
    }

    public destroy() {
        this.stream$?.unsubscribe();
        this.remoteEvents$.complete();
        this.localEvents$.unsubscribe();
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

        const touchedDocs = await this.collection.table.toCollection()
            .filter(doc => doc.touched)
            .toArray();

        await this.push(touchedDocs);
    }

    public startStream() {
        this.stream$ = this.pullOptions.stream$.subscribe(async (data) => {
            if (data === 'RESYNC') {
                this.pull();
                return;
            }

            let docs = data.documents;
            if (this.pullOptions.modifier) {
                docs = docs.map(this.pullOptions.modifier);
            }
            await this.collection.remoteBulkAdd(docs);
            await this.collection.setCheckpoint(data.checkpoint);

            this.remoteEvents$.next(docs);
        });
    }

    public push(docs: MyDocument<any, unknown>[]) {
        if (docs.length === 0 || !this.pushOptions) return;

        // create deep copies to avoid modifying MyDocument instances.
        docs = docs.map(doc => doc.isClassObject ? doc.lastData : doc)
            .map(doc => JSON.parse(JSON.stringify(doc)));

        this.pushInterval(docs).catch(err => {
            // try push each min until succession
            const pushInterval = setInterval(async () => {
                try {
                    await this.pushInterval(docs);
    
                    clearInterval(pushInterval);
                } catch { }
            }, 60 * 1000);
        });
    }

    public async pushInterval(docs: any[], secondTry = false) {
        if (!this.pushOptions) return;

        let pushRows: MyPushRow[] = await Promise.all(
            docs.map(doc => this.getPushRow(doc))
        );
        let conflicts = await this.pushOptions.handler(pushRows);

        // handle conflicts
        if (conflicts.length > 0 && !secondTry) {
            // apply pull modifier
            if (this.pullOptions.modifier) {
                conflicts = conflicts.map(doc => {
                    if (this.pullOptions.modifier)
                        return this.pullOptions.modifier(doc);
                    return doc;
                });
            }
            
            // update masterstate
            await this.collection.remoteBulkAdd(conflicts);
            
            // try again with updated data
            await this.pushInterval(docs, true);
        } else if (conflicts.length === 0) {
            await this.collection.markUntouched(docs);
        }
    }

    private async getPushRow(doc: any): Promise<MyPushRow> {
        const primaryKey = this.collection.primaryKey;
        const docId = doc[primaryKey];
        let assumedMaster = await this.collection.masterTable.get(docId);

        const pushRow: MyPushRow = {
            newDocumentState: this.applyPushMod(doc)
        };

        if (!!assumedMaster) {
            pushRow.assumedMasterState = this.applyPushMod(assumedMaster);
        }
        return pushRow;
    }

    private applyPushMod(doc: any): any {
        // modify only a copy
        let mod = JSON.parse(JSON.stringify(doc));

        // remove everthing that is not defined by the schema
        Object.keys(mod).forEach(key => {
            if (this.collection.schema && !(key in this.collection.schema.properties)) {
                    delete mod[key];
            }
        });
        
        // apply modifier if defined
        if (!!this.pushOptions?.modifier) {
            mod = this.pushOptions.modifier(mod);
        }
        
        return mod;
    }
}