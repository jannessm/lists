# Refactoring Plans

---

## [3] Fix Sync Visibility — Changes Only Appear After Logout/Login

### Overview

Remote changes (arriving via Pusher/WebSocket) and even local writes are sometimes not reflected in the UI until the app is reloaded or the user logs out and back in. A manual `resync()` call in `AppComponent` works around this but is a symptom of a deeper Angular change-detection problem, not a real fix.

### Root Cause: Dexie Runs Outside Angular's NgZone

Angular uses **zone.js** to detect when async work finishes and automatically schedule change detection. Zone.js monkey-patches the browser's native async APIs (`setTimeout`, `Promise`, `XHR`, `WebSocket`, `fetch`, etc.). However, **Dexie uses its own internal Promise scheduler** (based on `IDBRequest.onsuccess` callbacks) and does **not** use the native `Promise` globally. Zone.js never patches Dexie's internal promises, so any `.then()` callback that resolves after a Dexie operation executes **outside Angular's NgZone**.

#### The broken update chain

```
User taps checkbox → item.patch()
  → collection.update()
      → await table.put(newDoc)          ← Dexie write; exits Angular zone here
      → this.$.next([newDoc])            ← fires OUTSIDE zone
        → MyQuery subscription fires     ← still outside zone
          → query.query().then(docs =>   ← another Dexie read
              subject.next(docs)         ← OUTSIDE zone → Angular never notified
            )
              → component subscription fires outside zone
                → signal.set() / this.items = docs  ← no CD triggered
```

The **same problem** applies to the remote path:

```
Pusher WebSocket message (inside zone via zone.js WebSocket patch)
  → ReplicationService.streamSubjects.next('RESYNC')
    → Replicator.pull()
      → collection.remoteBulkAdd(docs)
          → await table.bulkAdd(...)     ← exits zone
          → this.$.next([])              ← outside zone → UI stuck
```

Although WebSocket events start inside zone, the first `await` on a Dexie call loses the zone context. After that, the entire downstream chain is outside zone.

#### Secondary issue: `EventEmitter` used as an internal event bus

`MyCollection.$` was typed as Angular's `EventEmitter`, which is designed exclusively for component `@Output` bindings. Using it for service-to-service pub/sub is semantically wrong and makes the class depend on `@angular/core` in a non-injectable context. A plain `Subject` is correct here.

### Why the Workaround "Works"

`AppComponent.resync()` is called on `visibilitychange`, `pageshow`, and `focus` events. Zone.js patches all three of these DOM events, so the `resync()` call and the subsequent pull are started **inside** zone. The first pull handler fires inside zone, so the `subject.next()` in `MyQuery` eventually gets called inside zone and Angular runs change detection. This masks the bug — but only after the user switches away and back to the tab.

### Fix

**Wrap all `collection.$.next()` calls in `NgZone.run()`** by threading an optional `NgZone` instance into `MyCollection`. This ensures that regardless of where the call originates (a Dexie callback, a Pusher event, a background timer), the final emission that components subscribe to is always inside Angular's zone.

#### Scope of Changes

1. **`MyCollection`** (`src/app/mydb/collection.ts`)

   - Accept an optional `NgZone` as the last constructor parameter.
   - Add a private `emit(docs)` helper that calls `ngZone.run(() => this.$.next(docs))` when a zone is present, or `this.$.next(docs)` directly otherwise (preserves backwards compatibility in unit tests where no zone exists).
   - Replace all direct `this.$.next(...)` calls with `this.emit(...)`.
   - Replace `EventEmitter` with `Subject` from RxJS — `EventEmitter` is for `@Output` bindings only and must not be used as a general event bus.
2. **`DataService`** (`src/app/services/data/data.service.ts`)

   - Inject `NgZone` and pass it as the last argument to every `new MyCollection(...)` call in `addCollections()`.
3. **Tests** (`src/app/mydb/collection.spec.ts`) — new file

   - Verify `ngZone.run()` is called on `insert()`, `update()`, and `remoteBulkAdd()`.
   - Verify that omitting `NgZone` does not throw and still emits (backwards compatibility).
   - Verify `collection.$` is a `Subject` and not an `EventEmitter`.

### Status

- [X] `MyCollection` updated (emit via zone, replaced `EventEmitter` → `Subject`)
- [X] `DataService` injects and forwards `NgZone`
- [X] Unit tests added in `collection.spec.ts`
- [X] Remove the manual `resync()` calls from `AppComponent` once the fix is confirmed stable in production — removed the `lastPusherState` guard and `dataService.resync()` call; kept `authService.checkInit()` and the `visibilitychange` hook.

### Migration Path

1. Apply changes to `MyCollection` and `DataService` — already done.
2. Deploy and verify that list changes made on another device appear immediately without any tab-switch workaround.
3. Remove the `this.dataService.resync()` call from `AppComponent.resync()` (keep `this.authService.checkInit()`).

---

## [2] Persistent Sort Order for List Items + Optimistic UI Updates

### Overview

Replace the fully-recomputed, ephemeral sorting of list items with a hybrid approach: a **persistent `sort_order` field** stored globally on each item as the stable position index (fractional indexing), combined with **cached category assignment** so the expensive grocery-categorisation fuzzy match is not re-run on every render. Additionally, fix several **blocking UI update paths** in the custom DB layer (`MyCollection` / `MyDocument` / `MyQuery`) where the UI currently has to wait for sequential IndexedDB read+write operations before a user action (e.g. ticking a checkbox) is reflected on screen.

### Current Behavior

#### Sorting

Every time a list is opened or any item changes, the Angular `computed()` signal re-runs `groupItems()` in full:

1. **Category assignment** — for grocery lists each item is scored against every entry in the grocery-category dictionary via a fuzzy string-match (`voteForGroceryCategory`). Complexity: O(items × categories × words-per-item), runs synchronously on the main thread.
2. **Slot sorting** — `sortItems()` re-sorts every slot: done-status first, then `due` date, then `localeCompare` on name (alphabetical fallback).
3. There is **no persisted sort position** on the item. If the categorisation logic or grocery dictionary changes, items can silently change slots or order.

#### Blocking UI update path (identified by code analysis)

When a user taps a checkbox (`toggleDone()`), the following chain blocks the UI before Angular can re-render:

```
toggleDone()
  → item.patch()                           // MyDocument
    → collection.update()                  // MyCollection
      → await table.put(newDoc)            // ① IndexedDB WRITE — blocks here
      → $.next([newDoc])                   // emits to all MyQuery subscribers
        → MyQuery.update()
          → query.query()                  // full Dexie table scan
            → table.toCollection()
                .filter().toArray()        // ② IndexedDB READ — blocks here
          → subject.next(docs)             // Angular signal finally updates
            → computed() re-runs groupItems() // ③ O(N×C×W) on main thread
```

The UI cannot update until **two sequential IndexedDB operations complete** and then the full sort+group runs. The `replication$.next()` push to the server is already fire-and-forget (✓), but the local visual feedback is blocked.

### Problems

| Problem                                                                  | Impact                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Full O(N×C×W) grocery recompute on every change                        | Wasted CPU; noticeable lag on long grocery lists                           |
| Grocery category computed from item name at runtime                      | Category can change if the dictionary is updated, causing surprising jumps |
| No stable position field                                                 | Impossible to support manual drag-to-reorder                               |
| `localeCompare` alphabetical fallback inside a slot                    | Items re-order silently when renamed                                       |
| UI update blocked by IndexedDB WRITE before `$.next()`                 | User sees no visual feedback until the write completes                     |
| `MyQuery.update()` does a full table scan after every collection event | Unnecessary read latency; scales poorly with list size                     |

### Proposed Solution

Three complementary parts:

#### Part A — Persistent `sort_order` field (fractional indexing, globally scoped)

Add a floating-point `sort_order` column to `list_items`. The value is **global across the whole list** — not per-slot — so items can move freely between categories without losing their relative order context.

- Use **fractional indexing**: inserting between A (`sort_order=1.0`) and B (`sort_order=2.0`) gives `sort_order=1.5`. No renumbering needed.
- New items at the end of a list get `sort_order = maxSortOrderInList + 1.0`.
- A periodic client-side **rebalance** renumbers to integers (1, 2, 3, …) when the smallest gap drops below `1e-9`.
- `sort_order` replaces the `localeCompare` alphabetical fallback as the tiebreaker within a slot.

#### Part B — Cached `category` field (grocery lists)

Add a **local-only** `category` field to the item document (excluded from replication push). Populated once on first load or when `name` changes; reused on all subsequent renders. Reduces per-render cost from O(N×C×W) to O(1) for cached items.

#### Part C — Optimistic UI updates (fix blocking path)

The core fix: **emit to the UI immediately** with the in-memory new state, then persist to IndexedDB in the background.

`MyCollection.update()` and `MyCollection.insert()` currently `await table.put/add()` **before** calling `$.next()`. This must be inverted:

1. Build the new document state in memory.
2. Call `$.next([newDocInMemory])` immediately — Angular re-renders with optimistic state.
3. Persist to IndexedDB asynchronously (no `await` before the emit).
4. On write failure (rare): emit a correction via `$.next()` with rolled-back state and show a snackbar error.

Additionally, `MyQuery.update()` runs a full Dexie table scan on **every** `$.next()` event, even for unrelated items. Replace with an in-memory document cache inside `MyQuery` that patches only changed documents, falling back to a full scan only for structural changes (insertions/deletions, signalled by an empty array from `$.next()`).

### Scope of Changes

#### Backend (`backend/`)

1. **New migration — add `sort_order` to `list_items`**

   - `$table->double('sort_order')->nullable(false)->default(0);`
   - Add a DB index on `(lists_id, sort_order)`.
   - Backfill existing rows: `UPDATE list_items SET sort_order = ROW_NUMBER() OVER (PARTITION BY lists_id ORDER BY created_at)`.
2. **Expose `sort_order` in the GraphQL schema** (`graphql/list-item.graphql`)

   - Add `sort_order: Float!` to the `ListItem` type and create/update input types.
3. **Conflict handler update for `sort_order`** (`backend/app/Models/ListItem.php` push resolver)

   - `sort_order` uses **last-write-wins** (highest `updatedAt` wins), matching the existing LWW strategy.
4. **Ordered default pull query**

   - `pullBulk` should `ORDER BY sort_order ASC` so items arrive pre-sorted, eliminating the client-side sort on initial load.

#### Frontend (`frontend/`)

5. **Update `ITEM_SCHEMA`** (`src/app/mydb/types/list-item.ts`)

   - Add `sort_order: { type: 'number' }` — synced field.
   - Add `category: { type: ['string', 'null'] }` — **local-only**; stripped by `Replicator.applyPushMod()` which already removes keys not in the schema (ensure `category` is not added to the GraphQL type).
   - Bump schema version; Dexie migration sets `sort_order = 0` for existing local docs (correct values pulled on next resync).
6. **Update `newItem()` factory** (`src/app/mydb/types/list-item.ts`)

   - Accept `maxSortOrder: number` parameter; set `sort_order = maxSortOrder + 1.0`.
7. **Update `itemsConflictHandler`** (`src/app/mydb/types/list-item.ts`)

   - Add `sort_order`: LWW via `updatedAt`.
   - Do **not** propagate `category` — it is local-only.
8. **Update `sortItems()`** (`src/models/categories.ts`)

   - New sort priority within a slot:
     1. `done=false` before `done=true`.
     2. Among not-done with `due`: ascending `due`.
     3. Among not-done without `due`: ascending `sort_order`.
     4. Among done: ascending `sort_order`.
   - Remove the `localeCompare` alphabetical fallback entirely.
9. **Update `groupItems()`** (`src/models/categories.ts`)

   - For grocery lists: read `item.category` if set; if unset, compute via `voteForGroceryCategory` and write back via `item.patch({ category: computed })`.
   - `sort_order` is global — slot ordering within a category is determined directly by the global value.
10. **New rebalance utility** (`src/models/sort-order.ts`)

    - `needsRebalance(items: MyItemDocument[]): boolean` — true if min adjacent gap < `1e-9`.
    - `rebalance(items: MyItemDocument[]): { id: string, sort_order: number }[]` — assigns integer positions 1, 2, 3, …
    - Called at the end of `groupItems()` if needed; patches are batched into a single write + push.
11. **Fix `MyCollection.update()` and `MyCollection.insert()` — optimistic emit** (`src/app/mydb/collection.ts`)

    - Build the new doc state in memory.
    - Call `$.next([newDocOptimistic])` **immediately**, before any `await`.
    - Start the IndexedDB write in the background: `table.put(newDoc).then(() => replication$.next()).catch(() => { $.next([rollback]); snackbar.error(...) })`.
12. **Fix `MyQuery.update()` — in-memory document cache** (`src/app/mydb/query.ts`)

    - `MyQuery` maintains an internal `Map<primaryKey, MyDocument>` as its current result set.
    - When `collection.$.next([updatedDocs])` fires with a **non-empty** array: patch only those documents in the map (O(k), typically k=1).
    - When `collection.$.next([])` fires (bulk/structural change, e.g. remote pull): fall back to a full Dexie scan.
    - This eliminates the per-action IndexedDB read for all typical user interactions.

### Optimistic Update Flow (after fix)

```
toggleDone()
  → item.patch()
    → collection.update()
      → build newDocOptimistic in memory
      → $.next([newDocOptimistic])          // ① UI updates IMMEDIATELY (< 1 ms)
        → MyQuery patches in-memory map     // O(1)
        → subject.next(docs)
          → computed() re-runs groupItems() // O(N), cache hits only
      → table.put(newDoc) [background]      // ② IndexedDB write, no await
        → replication$.next() [background]  // ③ push to server, already async
```

### Sort Priority Summary

```
Within a slot:
  1. done=false  before  done=true
  2. (not done, has due)  → sort by due ASC
  3. (not done, no due)   → sort by sort_order ASC  ← replaces localeCompare
  4. (done)               → sort by sort_order ASC
```

### Data Integrity Guarantees

| Risk                                                   | Mitigation                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Two clients insert at the same global position         | LWW on `sort_order` via `updatedAt`; fractional indexing makes collision extremely unlikely                |
| Sort order drift after many insertions                 | Client-side rebalance at gap < 1e-9; synced back as a normal patch                                             |
| Grocery category changes when dictionary updated       | Cache keyed to `name`; clearing local storage or a one-time migration flag invalidates all cached categories |
| Optimistic update followed by server conflict          | Conflict handler resolves;`$.next()` re-renders corrected state; user sees a brief flicker at most           |
| Existing items have `sort_order = 0` after migration | Backend backfill sets correct values; client pulls on next resync                                              |

### Migration Path

1. Write backend migration (`sort_order` column + index + backfill).
2. Update `ITEM_SCHEMA` (add `sort_order`, `category`); bump Dexie schema version.
3. Update `newItem()`, `sortItems()`, `groupItems()`, `itemsConflictHandler`.
4. Write `sort-order.ts` rebalance utility.
5. Fix `MyCollection.update/insert` for optimistic emit (Part C).
6. Fix `MyQuery.update()` for in-memory cache (Part C).
7. Update GraphQL schema and resolvers.
8. Run tests; verify order stability on concurrent edits and correct optimistic rollback on conflict.

### Open Questions

- [X] When a grocery item's `name` changes and its cached `category` is invalidated, should it snap to the new category immediately or wait for the user to confirm: No, the change should apply immediately.

### Decisions

- [X] **`sort_order` is scoped per list:** The value is unique within a `lists_id`. No item appears in multiple lists, so there is no cross-list ordering concern.
- [X] **Simultaneous inserts by two collaborators:** Both may compute the same `maxSortOrder + 1.0`. LWW via `updatedAt` resolves the conflict; the first writer wins the bottom position. The losing item may jump one slot, which is acceptable — fractional indexing keeps collisions extremely rare in practice.
- [X] **Optimistic rollback UX:** On IndexedDB write failure, show a snackbar telling the user "The change could not be saved." The item snaps back to its previous state only after the user dismisses/acknowledges the snackbar (not silently).
- [X] **`category` cache invalidation:** `category` is cleared and immediately recomputed inside `item.patch()` whenever `name` is part of the patch payload. This gives immediate, in-place category assignment without waiting for the next `groupItems()` cycle.
- [X] **Rebalance timing:** Rebalance runs in the background after a list is opened (not inside `computed()`), so the user never observes any compute pause. Patches are batched and pushed as a normal background write.
- [X] **New item `sort_order` initial value:** New items use `maxSortOrder + 1.0` within the list. The fuzzy grocery algorithm determines which slot the item appears in; `sort_order` is the tiebreaker within that slot.

### Notes

- **Drag-to-reorder** (optional future feature, not in scope for this refactoring): once `sort_order` is in place, drag-to-reorder can be added to grocery lists. When a user drags an item into a different grocery category slot, the app should send a **notification email to the list admin** containing the item name, the source category, and the target category. This creates a passive feedback loop to improve the grocery dictionary over time without requiring any explicit user submissions.

### Implementation Status

- [X] **Backend migration** — `2026_05_27_000001_add_sort_order_to_list_items.php` adds `sort_order DOUBLE NOT NULL DEFAULT 0`, index on `(lists_id, sort_order)`, and SQLite-compatible backfill using a correlated subquery.
- [X] **GraphQL schema** — `sort_order: Float!` added to `ListItem` type; `sort_order: Float` added to `ListItemInput` in `graphql/list-item.graphql`.
- [X] **`ITEM_SCHEMA`** — `sort_order: { type: 'number' }` added to `list-item.ts` properties. `category` is intentionally **not** added to the schema so it is never pushed to the server.
- [X] **`newItem()`** — accepts optional `maxSortOrder` parameter; sets `sort_order = maxSortOrder + 1.0`.
- [X] **`itemsConflictHandler()`** — `sort_order` uses LWW via `updatedAt`; `category` is never propagated.
- [X] **`sortItems()`** — replaced `localeCompare` alphabetical fallback with `sort_order` tiebreaker. New priority: done-status → not-done with due (ascending due) → not-done without due (ascending sort_order) → done (ascending sort_order).
- [X] **`groupItems()`** — reads `(item as any).category` cache; on miss, computes via `voteForGroceryCategory` and fires `item.patch({ category })` asynchronously (fire-and-forget). `category` is local-only.
- [X] **`sort-order.ts`** — new utility with `needsRebalance(sortOrders)` (gap < 1e-9) and `rebalance(sortOrders)` (reassigns integers 1, 2, 3, …).
- [X] **`MyCollection.insert()` / `update()` — optimistic emit** — emit fires synchronously before `await table.add/put()`; write continues in background; on failure, emit `[]` triggers a full-scan rollback.
- [X] **`MyQuery` — in-memory cache** — maintains a `Map<pk, MyDocument>` cache; on non-empty emit patches changed documents without hitting IndexedDB; on empty emit `[]` falls back to a full Dexie scan.
- [X] **`MyDocument.patch()`** — deletes `newDoc.category` whenever `'name' in patch` to invalidate the grocery-category cache.
- [X] **`ReplicationService` push modifier** — explicit `delete doc['category']` for `items` collection before the GraphQL push (belt-and-suspenders alongside `filterObjectBySchemaFields`).
- [X] **Tests — backend** — `SortOrderTest.php`: column existence, default value, GraphQL pull returns `sort_order`, push persists `sort_order`, conflict detection when `sort_order` diverges.
- [X] **Tests — `sort-order.spec.ts`** — `needsRebalance` and `rebalance` unit tests.
- [X] **Tests — `categories.spec.ts`** — `sortItems` priority order, `groupItems` category caching (cache hit skips patch, cache miss fires patch, correct slot placement).
- [X] **Tests — `list-item.spec.ts`** — conflict handler updated: `sort_order` LWW with newer/older `updatedAt`.
- [X] **Tests — `collection.spec.ts`** — optimistic-emit tests: emit fires before DB write, rollback on write failure.
- [X] **Tests — `query.spec.ts`** — in-memory cache tests: initial full scan, patch without full scan, delete removes from cache, empty emit triggers full scan, insert adds to cache.
- [X] **GitHub Actions** — `.github/workflows/frontend-tests.yml` added to run `ng test --no-watch --no-progress --browsers=ChromeHeadless` on every push/PR.

## [4] Bug Fixes

### [4.1] Adding / Manipulating Items with a Due Date + Reminder

#### Bug A — `value` getter emits the literal string `"different"` when flatpickr is closed without a selection

**Location:** `frontend/src/app/components/selects/date-chip-select/date-chip-select.component.ts` — `get value()`

**Reproduction:** Click the *"Andere"* ("Other") chip in the due-date selector → immediately close the flatpickr calendar without choosing a date → submit the item.

**Root cause:** When the flatpickr `onClose` fires without a date being picked, `this.flatpickr.selectedDates[0]` is `undefined`, so `closePickr()` sets `this.date = undefined`. The `value` getter then evaluates:

```ts
case 'different':
  if (typeof this.date === 'string' && !!this.date) { ... }
  else { return this.chipOption; }  // returns 'different'
```

`typeof undefined === 'string'` is `false`, so the getter returns the literal string `"different"`. This propagates through `onChange` to the parent form control, and the Angular form's value becomes `"different"`.

**Downstream consequence in `list.component.ts`:** `getDueDate('different')` hits the `default` switch branch and returns the raw string `"different"`. `newItem({ due: 'different', ... })` persists an invalid date string to IndexedDB and the replication push sends it to the backend, which accepts any non-null string in the `due` field.

**Downstream consequence in `update-item-sheet.component.ts`:** `new Date('different')` is `Invalid Date`. `datesAreEqual` returns false, so `patch.due = 'different'` is written to the item document on every save attempt.

**Fix:** In `get value()`, when `this.date` is falsy (including `undefined`), treat it as if no date was selected — return the default option instead of `'different'`:

```ts
get value(): string {
  if (this.chipOption === 'different') {
    const d = this.date;
    if (d instanceof Date && !isNaN(d.valueOf())) return d.toISOString();
    if (typeof d === 'string' && !!d)              return new Date(d).toISOString();
    // picker was opened but closed without a selection — fall back to default
    this.chipOption = this.defaultOption || '';
    return this.chipOption;
  }
  return this.chipOption;
}
```

Also add a guard in `closePickr()` to clear the chip back to the default when `selectedDates[0]` is `undefined`:

```ts
closePickr() {
  if (this.pickrIsOpen && this.flatpickr) {
    this.pickrIsOpen = false;
    const picked = this.flatpickr.selectedDates[0];
    if (!picked) {
      // user dismissed without picking — revert to default
      this.chipOption = this.defaultOption || '';
      this.date = '';
    } else {
      this.date = picked;
    }
    this.pickrClosed.emit();
    this.onChange(this.value);
    this.onTouched();
  }
}
```

---

#### Bug B — `writeValue` silently misses `flatpickr.setDate()` because flatpickr is not yet initialised

**Location:** `date-chip-select.component.ts` — `writeValue()` / `ngAfterViewInit()`

**Reproduction:** Open the *Edit item* bottom sheet for an item that already has a custom due date (one that maps to the *"Andere"* chip). The chip correctly shows the formatted date but when the user taps that chip to open the datepicker, it opens with no date pre-selected (empty calendar).

**Root cause:** Angular's reactive-form machinery calls `writeValue()` during component initialisation, which happens **before** `ngAfterViewInit()`. `writeValue` contains `this.flatpickr?.setDate(this.date)` — the optional chaining silently no-ops because `this.flatpickr` is still `undefined`. When `initFlatpickr()` runs in `ngAfterViewInit()`, the stored `this.date` is correct but `setDate` is never called again, so the flatpickr instance starts with an empty selection.

**Consequence:** If the user opens the picker and closes it without choosing a new date, `closePickr()` reads `flatpickr.selectedDates[0] === undefined` → falls into Bug A above → the existing due date is silently overwritten with `null`/`"different"`.

**Fix:** After calling `initFlatpickr()` in `ngAfterViewInit()`, re-apply any date that `writeValue` may have stored while flatpickr was not yet ready:

```ts
ngAfterViewInit(): void {
  this.initFlatpickr();
  // re-apply a date stored by writeValue() before flatpickr was ready
  if (this.date) {
    this.flatpickr?.setDate(this.date);
  }
}
```

---

#### Bug C — Stale flatpickr selection when chip is toggled away from *"Andere"*

**Location:** `date-chip-select.component.ts` — `changeOption()`

**Reproduction:** Pick a custom date via the *"Andere"* chip → switch to *"Heute"* or *"Morgen"* → switch back to *"Andere"* → the calendar opens with the previously picked date still highlighted, even though the component's effective value has been reset to the preset option.

**Root cause:** `changeOption()` sets `this.date = ''` when deselecting the custom chip, but never calls `this.flatpickr?.clear()`. The flatpickr instance retains its internal `selectedDates` array from the previous session.

**Fix:** In the deselect branch of `changeOption()`, and whenever any non-`'different'` chip is selected, clear the flatpickr instance:

```ts
changeOption(event: MatChipListboxChange) {
  setTimeout(() => {
    if (!event.value) {
      this.chipOption = this.defaultOption || '';
      this.date = '';
      this.flatpickr?.clear();     // ← add this
      this.onChange(this.value);
      this.onTouched();
    } else if (event.value === 'different' && this.showOthers && !this.pickrIsOpen) {
      this.openFlatpickr();
    } else {
      this.date = '';
      this.flatpickr?.clear();     // ← add this
      this.onChange(this.value);
      this.onTouched();
    }
  }, 10);
}
```

---

#### Bug D — `pickrClosed` emitted before `onChange` — parent form sees old value during the close event

**Location:** `date-chip-select.component.ts` — `closePickr()`

**Reproduction:** In the *add item* bar in `list.component`, the `(pickrClosed)` output is bound to `closeFocusInput()`. `closeFocusInput()` reads the `pickerOpen` / `ignoreNext` state and optionally refocuses the text input. Because `pickrClosed.emit()` fires **before** `this.onChange(this.value)`, any handler on the parent that tries to read the form-control value at that moment will still see the pre-pick value.

**Root cause:** In `closePickr()`:

```ts
this.pickrClosed.emit();    // ① parent handler runs now
this.onChange(this.value);  // ② form control updated AFTER
```

**Fix:** Swap the two lines so the form control is always up to date before any parent handler fires:

```ts
this.onChange(this.value);  // ① update form value first
this.onTouched();
this.pickrClosed.emit();    // ② then notify parent
```

---

#### Bug E — Default reminder applied even when `due` is the literal `"different"` (invalid date)

**Location:** `frontend/src/app/components/list/list.component.ts` — `addItem()`

**Root cause (depends on Bug A):** When Bug A is present and `getDueDate(...)` returns `"different"`, `!!due` is `true` (non-empty string). The guard `if (!!due && !!defaultReminder)` passes, and `getReminderDate(new Date("different"), ...)` is called. `new Date("different")` is `Invalid Date`; all arithmetic on it produces `NaN`. The resulting `reminder` ISO string is `"Invalid Date"`, which is persisted to the database.

**Fix (primary):** Fix Bug A so `getDueDate` never receives `"different"`. As an additional defensive layer, validate the date before calling `getReminderDate`:

```ts
const due = getDueDate(this.newItemDue.value || '');
const dueDate = due ? new Date(due) : null;

if (dueDate && !isNaN(dueDate.valueOf()) && defaultReminder) {
  Object.assign(item, { reminder: getReminderDate(dueDate, defaultReminder) });
}
```

---

### Interaction Between Datepicker and Date Chip — Summary

The `DateChipSelectComponent` combines a `MatChipListbox` (preset options) with a **flatpickr** calendar instance (custom date via the *"Andere"* chip). The following interaction contract is currently broken in several places:

| State transition                                                    | Expected behaviour                                                         | Actual behaviour (before fixes)                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Open sheet with existing custom date                                | Chip shows `"Andere"` with formatted date; datepicker opens to that date | Datepicker opens empty (Bug B)                                                            |
| Click*"Andere"*, close calendar without picking                     | Revert to previous chip selection, form value unchanged                    | Form value set to `"different"` (Bug A)                                                 |
| Pick custom date, then switch to*"Heute"*, then back to*"Andere"* | Datepicker opens empty (no pre-fill)                                       | Datepicker opens to the old custom date (Bug C)                                           |
| Save item after picking a custom date                               | `due` = selected ISO string                                              | `due` may still be the old value if parent read the form during the close event (Bug D) |
| Add item; flatpickr mis-emits `"different"`                       | `reminder` not set                                                       | `reminder` = `"Invalid Date"` (Bug E)                                                 |

---

### [4.2] Duplicate Push Notifications When Another User Changes Items

#### Overview

When a collaborator edits one or more items in a shared list, the other list members receive **two or more identical push notifications** for the same change. This is caused by three independent issues in the push replication pipeline: a missing concurrency guard on the client, a retry that re-submits already-processed items, and a typo in the server-side notification classifier.

---

#### Bug F — No concurrency guard in `Replicator.push()` — overlapping push calls include the same touched items twice

**Location:** `frontend/src/app/mydb/replication.ts` — `push()` / `constructor`

**Reproduction:** Edit an item in a shared list. On slow connections the problem is reproducible reliably; on fast connections it occurs when two items are updated in rapid succession (e.g. ticking a checkbox while the name was just edited).

**Root cause:** `replication$` is a plain `Subject`. Every `MyCollection.update()` or `MyCollection.insert()` calls `replication$.next()`, which immediately triggers `push()`. The `push()` method queries the database for **all currently `touched` documents** and sends them in a batch:

```ts
// constructor wires every emission directly to push()
this.replicationSub = this.collection.replication$.subscribe(() => {
    this.push();   // no guard — starts a new push even if one is in flight
});
```

If two updates occur close together:

```
update(item1) → replication$.next() → push() starts → queries touched: [item1]
update(item2) → replication$.next() → push() starts CONCURRENTLY
                                        → queries touched: [item1, item2]
                                          (item1 not yet markUntouched)
```

Both concurrent pushes send `item1` to the server. The server calls `ListItemChanged::dispatch` once for each successful batch. `ItemChangedHandler` fires twice, both times finding `item1` in its payload → two push notifications are dispatched to all other list members.

**Fix:** Use an `isPushing` flag to ensure only one push is in flight at a time:

```ts
private isPushing = false;

public async push() {
    if (this.isPushing || !this.pushOptions) return;
    this.isPushing = true;
    try {
        // ... existing push logic ...
    } finally {
        this.isPushing = false;
    }
}
```

A dirty flag should be set whenever `replication$.next()` fires while `isPushing` is `true`, so that a follow-up push is triggered automatically when the in-flight push completes.

---

#### Bug G — Retry loop re-submits already-processed items on timeout, causing duplicate server dispatch

**Location:** `frontend/src/app/mydb/replication.ts` — `push()` — the `setInterval` retry block

**Root cause:** When the server processes a push request successfully but the HTTP response times out or fails on the client side, `pushInterval` throws and the catch block enters the retry loop:

```ts
this.pushInterval(docs).catch(err => {
    // retry every second with the ORIGINAL docs snapshot
    const pushInterval = setInterval(async () => {
        try {
            await this.pushInterval(docs);   // ← re-sends items already written to DB
            clearInterval(pushInterval);
        } catch { }
    }, 1 * 1000);
});
```

The `docs` array is a **snapshot taken before the first attempt**. If the server already upserted those items and dispatched `ListItemChanged`, the retry causes a second upsert + second dispatch → duplicate notification.

**Fix:** Call `markUntouched` only after the server response is confirmed (or the request definitively times out). Before each retry, re-query the database to check whether the items are still `touched`. Items that were successfully processed will have been `markUntouched`'d; only genuinely unsynced items should be retried:

```ts
this.pushInterval(docs).catch(() => {
    const retryInterval = setInterval(async () => {
        // re-read touched docs — avoids re-sending already-processed items
        const stillTouched = await this.collection.table
            .toCollection()
            .filter((d: any) => doc.touched && docs.some(orig => orig[pk] === d[pk]))
            .toArray();

        if (stillTouched.length === 0) {
            clearInterval(retryInterval);
            return;
        }

        try {
            await this.pushInterval(stillTouched);
            clearInterval(retryInterval);
        } catch { }
    }, 1_000);
});

```

---

#### Summary

| Bug         | Layer                       | Root cause                                                                                | Effect                                                              |
| ----------- | --------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **F** | Frontend `replication.ts` | No concurrency guard on `push()` — concurrent calls include the same `touched` items | Duplicate `ListItemChanged` dispatches → duplicate notifications |
| **G** | Frontend `replication.ts` | Retry uses original snapshot; server may have already processed the batch                 | Re-dispatch on timeout → duplicate notifications                   |
|             |                             |                                                                                           |                                                                     |

Fixing **F** (exhaustMap / isPushing flag) eliminates the most common source of duplicates. **G** is a defensive fix for timeout edge-cases.
