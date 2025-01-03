import { signal } from "@angular/core";
import { of } from "rxjs";
import { MyCollectionSpy, MyShoppingListsCollectionSpy } from "./db.mock";

export class DataServiceSpy {
    groceryCategories = [];

    db = {
        items: new MyCollectionSpy(),
        users: new MyCollectionSpy(),
        lists: new MyShoppingListsCollectionSpy()
    };
}