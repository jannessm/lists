export function getDBMock() {
    return jasmine.createSpyObj('DB_INSTANCE', ['destroy'], {
        me: {remove: Promise.resolve},
        items: {remove: Promise.resolve},
        users: {remove: Promise.resolve},
        lists: {remove: Promise.resolve},
    })
}