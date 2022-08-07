import { GroceryCategories, GROCERY_OTHERS } from "./categories_groceries";
import { is_past, is_sometime, is_soon, is_today, is_tomorrow, TIMESLOTS } from "./categories_timeslots";
import { ListItem } from "./lists";


export interface Category {
  calcVotes: Function | Function[];
  name: string;
}

export interface Slot {
  name: string | TIMESLOTS;
  items: ListItem[];
}

export function sortItems(items: ListItem[]) {
  items.sort((a, b) => {
    const c = a.done ? 1 : 0;
    const d = b.done ? 1 : 0;

    if (a.time && b.time) {
      return a.time.getTime() - b.time.getTime();
    }

    if (c - d == 0) {
      return a.name.localeCompare(b.name);
    }

    return c - d;
  });
}
  
function voteForGroceryCategory(categoryItems: string[]) {
  return (item: ListItem) => {
    let votes = 0;

    categoryItems.forEach(catItem => {
      item.name.split(' ').forEach(itemWord => {
        const offset = itemWord.toLowerCase().indexOf(catItem.toLowerCase()) + 1;
        const weight = offset > 0 ? catItem.length : 0;
        votes += weight + offset;
      });
    });

    return votes;
  };
}

function compareGrocerySlots(categoryNames: string[]) {
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
  
export function groupItems(items: ListItem[], isGroceries: boolean, groceryCategories: GroceryCategories | undefined = undefined) {
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

    return votes.reduce((vote, cat) => cat.votes > vote.votes ? cat : vote, {votes: 0, name: GROCERY_OTHERS, item: i})
  });

  catItemAssignment.forEach(highestVotes => {
    let slot = slots.find((val) => highestVotes.name === val.name);
    if (!slot) {
      slot = {name: highestVotes.name, items: []}
      slots.push(slot);
    }

    slot.items.push(highestVotes.item);
  });
  
  slots.forEach(cat => sortItems(cat.items));
  
  if (isGroceries && groceryCategories) {
    slots.sort(compareGrocerySlots(Object.keys(groceryCategories)));
  }

  return slots;
}
