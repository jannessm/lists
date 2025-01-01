import { MyCollection } from "./collection";

export class MyDocument<DocType, DocMethods> {
    key: string | number;
    isClassObject = true;

    constructor(
        private collection: MyCollection<DocType, DocMethods>,
        private data: DocType
    ) {
        this.key = (this.data as any)[this.collection.primaryKey];

        Object.keys(this.data as any).forEach(key => {
            Object.defineProperty(this, key, {
                get: () => (this.data as any)[key]
            });
        });

        if (this.collection.methods) {
            Object.assign(this, this.collection.methods);
        }
    }

    async patch(patch: any) {
        // create a deep copy to not modify doc instance
        const newDoc = JSON.parse(JSON.stringify(this.data));
        Object.assign(newDoc, patch);
        return this.collection.update(newDoc);
    }

    async remove() {
        return this.patch({'_deleted': true});
    }
}