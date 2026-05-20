import { NgZone } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { MyCollection } from './collection';
import Dexie from 'dexie';

// ---------------------------------------------------------------------------
// Minimal Dexie stub — avoids opening a real IndexedDB in unit tests.
// ---------------------------------------------------------------------------
function makeDexieStub() {
  const store: Record<string, any> = {};

  const tableStub: any = {
    add: jasmine.createSpy('add').and.callFake(async (doc: any) => { store[doc.id] = doc; }),
    put: jasmine.createSpy('put').and.callFake(async (doc: any) => { store[doc.id] = doc; }),
    get: jasmine.createSpy('get').and.callFake(async (query: any) => store[query.id] ?? undefined),
    bulkGet: jasmine.createSpy('bulkGet').and.callFake(async (keys: string[]) => keys.map(k => store[k])),
    bulkPut: jasmine.createSpy('bulkPut').and.callFake(async (docs: any[]) => { docs.forEach(d => store[d.id] = d); }),
    bulkUpdate: jasmine.createSpy('bulkUpdate').and.callFake(async () => {}),
    bulkAdd: jasmine.createSpy('bulkAdd').and.callFake(async (docs: any[]) => { docs.forEach(d => store[d.id] = d); }),
    toCollection: () => ({ first: async () => Object.values(store)[0] }),
    filter: () => ({ delete: async () => {}, toArray: async () => [] }),
    clear: jasmine.createSpy('clear').and.callFake(async () => {}),
    toArray: jasmine.createSpy('toArray').and.callFake(async () => []),
  };

  const dexieStub = {
    table: jasmine.createSpy('table').and.returnValue(tableStub),
    _store: store,
  };

  return { dexieStub, tableStub };
}

const MINIMAL_SCHEMA = {
  primaryKey: 'id' as const,
  type: 'object' as const,
  required: ['id', 'name'] as const,
  version: 1 as const,
  properties: {
    id: { type: 'string' as const },
    name: { type: 'string' as const },
  },
  indexes: [],
};

// ---------------------------------------------------------------------------
// Helper: build a real NgZone or a spy that records whether run() was called.
// ---------------------------------------------------------------------------
function makeZoneSpy() {
  let runCallCount = 0;
  const zone: Pick<NgZone, 'run'> = {
    run: <T>(fn: (...args: any[]) => T) => {
      runCallCount++;
      return fn();
    },
  };
  return { zone: zone as NgZone, getRunCallCount: () => runCallCount };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MyCollection — NgZone integration', () => {

  it('calls ngZone.run() when emitting after insert()', async () => {
    const { dexieStub } = makeDexieStub();
    const { zone, getRunCallCount } = makeZoneSpy();

    const col = new MyCollection(
      dexieStub as unknown as Dexie,
      'items',
      MINIMAL_SCHEMA,
      undefined,
      undefined,
      zone,
    );

    const emitted: any[][] = [];
    col.$.subscribe(docs => emitted.push(docs));

    await col.insert({ id: '1', name: 'test' });

    expect(getRunCallCount()).toBeGreaterThan(0);
    expect(emitted.length).toBe(1);
  });

  it('calls ngZone.run() when emitting after update()', async () => {
    const { dexieStub } = makeDexieStub();
    const { zone, getRunCallCount } = makeZoneSpy();

    const col = new MyCollection(
      dexieStub as unknown as Dexie,
      'items',
      MINIMAL_SCHEMA,
      undefined,
      undefined,
      zone,
    );

    const emitted: any[][] = [];
    col.$.subscribe(docs => emitted.push(docs));

    await col.update({ id: '1', name: 'updated' });

    expect(getRunCallCount()).toBeGreaterThan(0);
    expect(emitted.length).toBe(1);
  });

  it('calls ngZone.run() when emitting after remoteBulkAdd()', async () => {
    const { dexieStub } = makeDexieStub();
    const { zone, getRunCallCount } = makeZoneSpy();

    const col = new MyCollection(
      dexieStub as unknown as Dexie,
      'items',
      MINIMAL_SCHEMA,
      undefined,
      undefined,
      zone,
    );

    const emitted: any[][] = [];
    col.$.subscribe(docs => emitted.push(docs));

    await col.remoteBulkAdd([{ id: '2', name: 'remote' }]);

    expect(getRunCallCount()).toBeGreaterThan(0);
    expect(emitted.length).toBe(1);
  });

  it('still emits without throwing when no NgZone is provided', async () => {
    const { dexieStub } = makeDexieStub();

    // No NgZone passed — should not throw; tests backwards compatibility.
    const col = new MyCollection(
      dexieStub as unknown as Dexie,
      'items',
      MINIMAL_SCHEMA,
    );

    const emitted: any[][] = [];
    col.$.subscribe(docs => emitted.push(docs));

    await col.insert({ id: '1', name: 'no-zone' });

    expect(emitted.length).toBe(1);
  });

  it('does NOT emit via ngZone.run() when NgZone is absent', async () => {
    const { dexieStub } = makeDexieStub();
    const { zone, getRunCallCount } = makeZoneSpy();

    // Intentionally omit zone
    const col = new MyCollection(
      dexieStub as unknown as Dexie,
      'items',
      MINIMAL_SCHEMA,
    );

    col.$.subscribe(() => {});
    await col.insert({ id: '1', name: 'no-zone' });

    expect(getRunCallCount()).toBe(0);
  });
});

describe('MyCollection — Subject instead of EventEmitter', () => {
  it('collection.$ is a Subject (not an EventEmitter) so it works outside Angular DI', () => {
    const { dexieStub } = makeDexieStub();
    const col = new MyCollection(
      dexieStub as unknown as Dexie,
      'items',
      MINIMAL_SCHEMA,
    );

    // Subject has no `emit` method, EventEmitter does — a safe discrimination
    expect(typeof (col.$ as any).emit).toBe('undefined');
    expect(typeof col.$.next).toBe('function');
  });
});
