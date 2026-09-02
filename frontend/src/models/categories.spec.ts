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

    it('sorts normal list items by due date first', () => {
        const later = makeItem({ name: 'later', done: false, due: new Date(2000).toISOString() });
        const earlier = makeItem({ name: 'earlier', done: true, due: new Date(1000).toISOString() });
        const items = [later, earlier];
        sortItems(items);
        expect(items[0]).toBe(earlier);
        expect(items[1]).toBe(later);
    });

    it('puts items without due dates after items with due dates in normal lists', () => {
        const withDue = makeItem({ name: 'with', due: new Date(Date.now() + 1000).toISOString() });
        const withoutDue = makeItem({ name: 'without', due: null });
        const items = [withoutDue, withDue];
        sortItems(items);
        expect(items[0]).toBe(withDue);
        expect(items[1]).toBe(withoutDue);
    });

    it('sorts by done/not-done when due date is the same for normal lists', () => {
        const sameDue = new Date(1000).toISOString();
        const done = makeItem({ name: 'a', done: true, due: sameDue });
        const notDone = makeItem({ name: 'b', done: false, due: sameDue });
        const items = [done, notDone];
        sortItems(items);
        expect(items[0]).toBe(notDone);
        expect(items[1]).toBe(done);
    });

    it('sorts alphabetically when due date and done state match in normal lists', () => {
        const banana = makeItem({ name: 'banana', done: false, due: null });
        const apple = makeItem({ name: 'apple', done: false, due: null });
        const items = [apple, banana];
        sortItems(items);
        expect(items[0]).toBe(apple);
        expect(items[1]).toBe(banana);
    });

    it('sorts grocery items by done/not-done and then alphabetically', () => {
        const done = makeItem({ name: 'apple', done: true });
        const notDoneZ = makeItem({ name: 'zucchini', done: false });
        const notDoneA = makeItem({ name: 'banana', done: false });
        const items = [done, notDoneZ, notDoneA];
        sortItems(items, true);
        expect(items[0]).toBe(notDoneA);
        expect(items[1]).toBe(notDoneZ);
        expect(items[2]).toBe(done);
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
