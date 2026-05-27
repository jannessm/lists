import { sortItems, groupItems, Slot } from './categories';
import { MyItemDocument } from '../app/mydb/types/list-item';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<any> = {}): MyItemDocument {
    return {
        id: Math.random().toString(36).slice(2),
        name: 'item',
        done: false,
        description: null,
        createdBy: 'user1',
        reminder: null,
        due: null,
        timezone: 'UTC',
        lists: 'list1',
        sort_order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false,
        isClassObject: true,
        key: 'key',
        patch: jasmine.createSpy('patch').and.returnValue(Promise.resolve()),
        remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve()),
        ...overrides,
    } as unknown as MyItemDocument;
}

// ---------------------------------------------------------------------------
// sortItems tests
// ---------------------------------------------------------------------------

describe('sortItems', () => {

    it('puts done items after not-done items', () => {
        const a = makeItem({ name: 'a', done: false, sort_order: 1 });
        const b = makeItem({ name: 'b', done: true,  sort_order: 2 });
        const items = [b, a];
        sortItems(items);
        expect(items[0]).toBe(a);
        expect(items[1]).toBe(b);
    });

    it('sorts not-done items with due dates before those without', () => {
        const withDue    = makeItem({ name: 'with',    done: false, due: new Date(Date.now() + 1000).toISOString(), sort_order: 2 });
        const withoutDue = makeItem({ name: 'without', done: false, due: null, sort_order: 1 });
        const items = [withoutDue, withDue];
        sortItems(items);
        expect(items[0]).toBe(withDue);
        expect(items[1]).toBe(withoutDue);
    });

    it('sorts by ascending due date among not-done items with due dates', () => {
        const earlier = makeItem({ name: 'e', done: false, due: new Date(1000).toISOString(), sort_order: 2 });
        const later   = makeItem({ name: 'l', done: false, due: new Date(2000).toISOString(), sort_order: 1 });
        const items = [later, earlier];
        sortItems(items);
        expect(items[0]).toBe(earlier);
        expect(items[1]).toBe(later);
    });

    it('uses sort_order as tiebreaker when no due dates are set', () => {
        const first  = makeItem({ name: 'z', done: false, sort_order: 1 });
        const second = makeItem({ name: 'a', done: false, sort_order: 2 });
        const items = [second, first];
        sortItems(items);
        expect(items[0]).toBe(first);
        expect(items[1]).toBe(second);
    });

    it('uses sort_order to sort done items among themselves', () => {
        const first  = makeItem({ name: 'z', done: true, sort_order: 1 });
        const second = makeItem({ name: 'a', done: true, sort_order: 2 });
        const items = [second, first];
        sortItems(items);
        expect(items[0]).toBe(first);
        expect(items[1]).toBe(second);
    });

    it('treats missing sort_order as 0', () => {
        const withOrder    = makeItem({ name: 'b', done: false, sort_order: 5 });
        const withoutOrder = makeItem({ name: 'a', done: false });
        delete (withoutOrder as any).sort_order;
        const items = [withOrder, withoutOrder];
        sortItems(items);
        expect(items[0]).toBe(withoutOrder);
        expect(items[1]).toBe(withOrder);
    });
});

// ---------------------------------------------------------------------------
// groupItems — category caching
// ---------------------------------------------------------------------------

describe('groupItems — category caching for grocery lists', () => {

    it('re-uses cached category and skips fuzzy computation', () => {
        const item = makeItem({ name: 'milk', category: 'Dairy' });

        const groceryCategories = {
            'Dairy': ['milk', 'cheese'],
            'Fruit': ['apple', 'banana'],
        };

        groupItems([item], true, groceryCategories);

        // patch should NOT have been called because category was already cached
        expect((item as any).patch).not.toHaveBeenCalled();
    });

    it('computes category when not cached and fires patch to store it', () => {
        const item = makeItem({ name: 'apple' });
        delete (item as any).category;

        const groceryCategories = {
            'Dairy': ['milk', 'cheese'],
            'Fruit': ['apple', 'banana'],
        };

        groupItems([item], true, groceryCategories);

        expect((item as any).patch).toHaveBeenCalled();
        const patchArg = (item as any).patch.calls.mostRecent().args[0];
        expect(patchArg).toEqual(jasmine.objectContaining({ category: jasmine.any(String) }));
    });

    it('places cached-category item in the correct slot', () => {
        const item = makeItem({ name: 'whatever', category: 'Fruit' });

        const groceryCategories = {
            'Dairy': ['milk'],
            'Fruit': ['apple'],
        };

        const slots = groupItems([item], true, groceryCategories);
        const fruitSlot = slots.find((s: Slot) => s.name === 'Fruit');
        expect(fruitSlot).toBeDefined();
        expect(fruitSlot!.items).toContain(item);
    });

    it('does not call patch for non-grocery lists', () => {
        const item = makeItem({ name: 'task', due: new Date().toISOString() });
        groupItems([item], false, undefined);
        expect((item as any).patch).not.toHaveBeenCalled();
    });
});
