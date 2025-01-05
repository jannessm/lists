import { signal } from "@angular/core"
import { of } from "rxjs"
import { MockMyListsDocument } from "../auth/auth.service.mock";

export function getDBMock() {
    return jasmine.createSpyObj('DB_INSTANCE', [], {
        me: new MyCollectionSpy(),
        items: new MyCollectionSpy(),
        users: new MyCollectionSpy(),
        lists: new MyCollectionSpy(),
    })
}

export class MyCollectionSpy {
    mockDoc: () => MockMyListsDocument | undefined = () => undefined;
    find = jasmine.createSpy('find').and.callFake(() => {
        return {
            $: of([this.mockDoc()])
        }
    });

    findOne = jasmine.createSpy('findOne').and.callFake(() => {
        return {
            $: of(this.mockDoc())
        }
    });

    findMany = jasmine.createSpy('findMany').and.callFake(() => {
        return {
            $: of([this.mockDoc()])
        }
    });

    insert = jasmine.createSpy('insert').and.returnValue(Promise.resolve());
}

export class MyShoppingListsCollectionSpy extends MyCollectionSpy {
    override mockDoc = () => new MockMyListsDocument(true);
}

export class MyItemSpy {
    remove = jasmine.createSpy('remove');
    patch = jasmine.createSpy('patch');
}