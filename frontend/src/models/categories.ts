import { GroceryCategories, GROCERY_OTHERS } from "./categories_groceries";
import { is_past, is_sometime, is_soon, is_today, is_tomorrow, TIMESLOTS } from "./categories_timeslots";
import { MyItemDocument } from "../app/mydb/types/list-item";


export interface Category {
  calcVotes: Function | Function[];
  name: string;
}

export interface Slot {
  name: string | TIMESLOTS;
  items: MyItemDocument[];
  nDone: number;
}

export function sortItems(items: MyItemDocument[]) {
  items.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, undefined, {
      sensitivity: 'base',
      numeric: true
    });
    if (byName !== 0) {
      return byName;
    }

    // stable tiebreaker for equal names: sort_order (ascending)
    const sa = a.sort_order ?? 0;
    const sb = b.sort_order ?? 0;
    return sa - sb;
  });
}
  
function voteForGroceryCategory(categoryItems: string[]) {
  return (item: MyItemDocument) => {
    let votes = 0;

    categoryItems.forEach(catItem => {
      item.name.split(' ').forEach(itemWord => {
        itemWord = itemWord.toLowerCase();
        itemWord = itemWord.normalize("NFD").replace(/\p{Diacritic}/gu, "")
        itemWord = itemWord.replace(/\(.*\)/, "")
        const offset = itemWord.indexOf(catItem) + 1;
        const weight = offset > 0 ? catItem.length : 0;
        votes += weight + offset;
      });
    });

    return votes;
  };
}

function compareSlots(categoryNames: string[]) {
  return (a: Slot, b: Slot) => {
    let id_a = categoryNames.findIndex(c => c === a.name);
    let id_b = categoryNames.findIndex(c => c === b.name);
    if (id_a < 0) {
      id_a = 999999999;
    }
    if (id_b < 0) {
      id_b = 999999999;
    }
    return id_a - id_b;
  };
}
  
export function groupItems(
  items: MyItemDocument[],
  isGroceries: boolean,
  groceryCategories: GroceryCategories | undefined = undefined
) {
  const slots: Slot[] = [];
  let categories: Category[] = [];
  
  if (isGroceries && groceryCategories) {
    categories = Object.entries(groceryCategories).map((entry) => {
      return {
        calcVotes: voteForGroceryCategory(entry[1]),
        name: entry[0]
      };
    });

  } else {
    categories = [
      {calcVotes: [is_today, is_past], name: TIMESLOTS.TODAY},
      {calcVotes: is_tomorrow, name: TIMESLOTS.TOMORROW},
      {calcVotes: is_soon, name: TIMESLOTS.SOON},
      {calcVotes: is_sometime, name: TIMESLOTS.SOMETIME},
    ];
  }

  const catItemAssignment = items.map(i => {
    // For grocery lists, use the cached category if available.
    // If the cache is missing, compute the category and store it
    // on the document (fire-and-forget; category is local-only and
    // not pushed to the server).
    if (isGroceries && groceryCategories) {
      const cachedCategory = (i as any).category as string | undefined;
      if (cachedCategory) {
        return { votes: 1, name: cachedCategory, item: i };
      }
    }

    const votes = categories.map(cat => {
        if (Array.isArray(cat.calcVotes)) {
          return {
            votes: cat.calcVotes.reduce((votes, fn) => fn(i) + votes, 0),
            name: cat.name,
            item: i
          };
        } else {
          return {
            votes: cat.calcVotes(i),
            name: cat.name,
            item: i
          };
        }
      });

    const result = votes.reduce((vote, cat) => {
      if (cat.votes > vote.votes) {
        return cat;
      } else {
        return vote;
      }
    }, {votes: 0, name: GROCERY_OTHERS, item: i});

    // Cache the computed category on the document so subsequent renders skip
    // the O(C×W) computation. category is local-only and never pushed to the
    // server (it is absent from ITEM_SCHEMA).
    if (isGroceries && groceryCategories) {
      i.patch({ category: result.name });
    }

    return result;
  });

  catItemAssignment.forEach(highestVotes => {
    let slot = slots.find((val) => highestVotes.name === val.name);
    if (!slot) {
      slot = {name: highestVotes.name, items: [], nDone: 0}
      slots.push(slot);
    }

    slot.items.push(highestVotes.item);
    slot.nDone += highestVotes.item.done ? 1 : 0;
  });
  
  slots.forEach(cat => sortItems(cat.items));
  
  if (isGroceries && groceryCategories) {
    slots.sort(compareSlots(Object.keys(groceryCategories)));
  } else {
    slots.sort(compareSlots(categories.map(c => c.name)))
  }

  return slots;
}
