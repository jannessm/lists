import { signal } from "@angular/core"
import { of } from "rxjs"

export function getDBMock() {
    return jasmine.createSpyObj('DB_INSTANCE', ['destroy'], {
        me: {remove: Promise.resolve},
        items: {remove: Promise.resolve},
        users: {remove: Promise.resolve},
        lists: {remove: Promise.resolve},
    })
}

export class MyCollectionSpy {
    find = jasmine.createSpy('find').and.returnValue({
        $: of(),
        $$: signal(undefined)
    });

    findOne = jasmine.createSpy('findOne').and.returnValue({
        $: of(),
        $$: signal(undefined)
    });

    findMany = jasmine.createSpy('findMany').and.returnValue({
        $: of([]),
        $$: signal([])
    });

    insert = jasmine.createSpy('insert').and.returnValue(Promise.resolve());
}

export class MyItemSpy {
    remove = jasmine.createSpy('remove');
    patch = jasmine.createSpy('patch');
}