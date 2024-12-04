import { signal } from "@angular/core"
import { of } from "rxjs"
import { MockMyListsDocument } from "../auth/auth.service.mock";
import { MyListsDocument } from "../../mydb/types/lists";

export function getDBMock() {
    return jasmine.createSpyObj('DB_INSTANCE', ['destroy'], {
        me: {remove: Promise.resolve},
        items: {remove: Promise.resolve},
        users: {remove: Promise.resolve},
        lists: {remove: Promise.resolve},
    })
}

export class MyCollectionSpy {
    mockDoc: () => MockMyListsDocument | undefined = () => undefined;
    find = jasmine.createSpy('find').and.callFake(() => {
        return {
            $: of(),
            $$: signal(this.mockDoc())
        }
    });

    findOne = jasmine.createSpy('findOne').and.callFake(() => {
        return {
            $: of(),
            $$: signal(this.mockDoc())
        }
    });

    findMany = jasmine.createSpy('findMany').and.callFake(() => {
        return {
            $: of(),
            $$: signal([this.mockDoc()])
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