import { Subscription } from "rxjs";
import { MyPullOptions, MyPushOptions, MyReplicationOptions } from "./types/replication";
import { MyCollection } from "./collection";
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
    private stream$?: Subscription;
    private replicationSub?: Subscription;

    constructor (
        private identifier: string,
        private collection: MyCollection<unknown, unknown>,
        private pullOptions: MyPullOptions,
        private pushOptions?: MyPushOptions,
    ) {
        this.pull().then(() => {
            this.startStream();
            this.replicationSub = this.collection.replication$.subscribe(() => {
                this.push()
            });
        });
    }

    public remove() {
        return this.collection.replicationTable.clear();
    }

    public destroy() {
        this.stream$?.unsubscribe();
        this.replicationSub?.unsubscribe();
    }

    public async pull() {
        console.log('pull', this.identifier);
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
                await this.collection.updateMasterState(docs);
                await this.collection.setCheckpoint(newDocs.checkpoint);
            } else {
                break;
            }
        }

        await this.push();
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
            await this.collection.updateMasterState(docs);
            await this.collection.setCheckpoint(data.checkpoint);
        });
    }

    public async push() {
        if (!this.pushOptions) return;

        let docs = await this.collection.table.toCollection()
            .filter((doc: any) => doc.touched)
            .toArray();

        if (docs.length === 0) {
            return;
        }

        console.log('push', docs);

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
            }, 1 * 1000);
        });
    }

    public async pushInterval(docs: any[], secondTry = false): Promise<void> {
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
            await this.collection.updateMasterState(conflicts);

            // try again with updated data
            return await this.pushInterval(docs, true);
        } else if (conflicts.length === 0) {
            return await this.collection.markUntouched(docs);
        } else {
            throw Error('push still has conflicts.');
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
