import { MyCollection } from './collection';
import { MyQuery } from './query';
import Dexie from 'dexie';

// ---------------------------------------------------------------------------
// Minimal Dexie stub — same pattern as collection.spec.ts
// ---------------------------------------------------------------------------
function makeDexieStub(initialDocs: any[] = []) {
  const store: Record<string, any> = {};
  initialDocs.forEach(d => store[d.id] = d);

  const tableStub: any = {
    add: jasmine.createSpy('add').and.callFake(async (doc: any) => { store[doc.id] = doc; }),
    put: jasmine.createSpy('put').and.callFake(async (doc: any) => { store[doc.id] = doc; }),
    get: jasmine.createSpy('get').and.callFake(async (q: any) => store[q.id] ?? undefined),
    bulkGet: jasmine.createSpy('bulkGet').and.callFake(async (keys: string[]) => keys.map(k => store[k])),
    bulkPut: jasmine.createSpy('bulkPut').and.callFake(async (docs: any[]) => { docs.forEach(d => store[d.id] = d); }),
    bulkUpdate: jasmine.createSpy('bulkUpdate').and.callFake(async () => {}),
    bulkAdd: jasmine.createSpy('bulkAdd').and.callFake(async (docs: any[]) => { docs.forEach(d => store[d.id] = d); }),
    toCollection: () => ({ first: async () => Object.values(store)[0] }),
    filter: (fn: (d: any) => boolean) => ({
      delete: async () => {},
      toArray: async () => Object.values(store).filter(fn),
    }),
    clear: jasmine.createSpy('clear').and.callFake(async () => { Object.keys(store).forEach(k => delete store[k]); }),
    toArray: jasmine.createSpy('toArray').and.callFake(async () => Object.values(store)),
  };

  const dexieStub = {
    table: jasmine.createSpy('table').and.returnValue(tableStub),
    _store: store,
  };

  return { dexieStub, tableStub, store };
}

const MINIMAL_SCHEMA = {
  primaryKey: 'id' as const,
  type: 'object' as const,
  required: ['id', 'name'] as const,
  version: 1 as const,
  properties: {
    id: { type: 'string' as const },
    name: { type: 'string' as const },
    _deleted: { type: 'boolean' as const },
  },
  indexes: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function flush() {
  // Allow pending microtasks (Promise chains) to complete
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('MyQuery — in-memory cache', () => {

  it('performs a full scan on construction and emits initial results', async () => {
    const docs = [
      { id: '1', name: 'a', _deleted: false },
      { id: '2', name: 'b', _deleted: false },
    ];
    const { dexieStub } = makeDexieStub(docs);

    const col = new MyCollection(dexieStub as unknown as Dexie, 'items', MINIMAL_SCHEMA);
    const query = col.find();

    await flush();

    const emitted = query.$.getValue ? (query.$ as any).getValue() : undefined;
    // Use the subscription to capture the latest value
    let latest: any[] = [];
    query.$.subscribe(v => latest = v);
    await flush();

    expect(latest.length).toBe(2);
  });

  it('patches cached docs without a full DB scan on non-empty emit', async () => {
    const docs = [{ id: '1', name: 'original', _deleted: false }];
    const { dexieStub, tableStub } = makeDexieStub(docs);

    const col = new MyCollection(dexieStub as unknown as Dexie, 'items', MINIMAL_SCHEMA);
    const query = col.find();

    await flush();
    // Reset spy call count after initial scan
    tableStub.toArray.calls.reset();

    // Trigger a non-empty emit by calling update()
    tableStub.put.and.callFake(async (doc: any) => { /* no-op – optimistic */ });
    await col.update({ id: '1', name: 'updated', _deleted: false });
    await flush();

    let latest: any[] = [];
    query.$.subscribe(v => latest = v);
    await flush();

    // toArray should NOT have been called again for the patch
    expect(tableStub.toArray).not.toHaveBeenCalled();
    // The in-memory result should have the updated name
    expect(latest.length).toBe(1);
    expect((latest[0] as any).name).toBe('updated');
  });

  it('removes a doc from the cache when it is deleted (filtered out)', async () => {
    const docs = [{ id: '1', name: 'will-be-deleted', _deleted: false }];
    const { dexieStub, tableStub } = makeDexieStub(docs);

    const col = new MyCollection(dexieStub as unknown as Dexie, 'items', MINIMAL_SCHEMA);
    const query = col.find();
    await flush();

    tableStub.put.and.callFake(async (doc: any) => { /* no-op */ });
    await col.update({ id: '1', name: 'will-be-deleted', _deleted: true });
    await flush();

    let latest: any[] = [];
    query.$.subscribe(v => latest = v);
    await flush();

    expect(latest.length).toBe(0);
  });

  it('triggers a full scan when collection emits an empty array', async () => {
    const docs = [{ id: '1', name: 'x', _deleted: false }];
    const { dexieStub, tableStub } = makeDexieStub(docs);

    const col = new MyCollection(dexieStub as unknown as Dexie, 'items', MINIMAL_SCHEMA);
    const query = col.find();
    await flush();

    tableStub.toArray.calls.reset();

    // remoteBulkAdd always emits []
    await col.remoteBulkAdd([{ id: '2', name: 'new', _deleted: false }]);
    await flush();

    expect(tableStub.toArray).toHaveBeenCalled();
  });

  it('adds a new doc to the cache when insert() emits it', async () => {
    const { dexieStub, tableStub } = makeDexieStub();

    const col = new MyCollection(dexieStub as unknown as Dexie, 'items', MINIMAL_SCHEMA);
    const query = col.find();
    await flush();

    tableStub.add.and.callFake(async (doc: any) => { /* no-op — optimistic */ });
    await col.insert({ id: '3', name: 'new item', _deleted: false });
    await flush();

    let latest: any[] = [];
    query.$.subscribe(v => latest = v);
    await flush();

    expect(latest.length).toBe(1);
    expect((latest[0] as any).name).toBe('new item');
  });
});
