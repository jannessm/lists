import { MyCollectionSpy, MyShoppingListsCollectionSpy } from "./db.mock";

export class DataServiceSpy {
    groceryCategories = [];

    db = {
        me: new MyCollectionSpy(),
        items: new MyCollectionSpy(),
        users: new MyCollectionSpy(),
        lists: new MyShoppingListsCollectionSpy()
    };

    resync = jasmine.createSpy('resync');
}