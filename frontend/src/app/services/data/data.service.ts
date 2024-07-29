import { Injectable, WritableSignal, signal } from '@angular/core';

import { ReplicationService } from '../replication/replication.service';
import { DATA_TYPE, Replications } from '../../../models/rxdb/graphql-types';
import { GroceryCategories } from '../../../models/categories_groceries';
import { HttpClient } from '@angular/common/http';
import { BASE_API } from '../../globals';
import { DB_INSTANCE, RxListsDatabase } from './init-database';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  replications: Replications = {};
  dbInitialized = false;

  groceryCategories: GroceryCategories | undefined;

  constructor(
    private replicationService: ReplicationService,
    private http: HttpClient
  ) {
    this.http.get<GroceryCategories>(BASE_API + 'grocery-categories').subscribe(cats => {
      this.groceryCategories = cats;
    });
  }

  get db(): RxListsDatabase {
    return DB_INSTANCE;
  }

  async initDB(meId: string | null) {
    if (this.db && !this.dbInitialized) {
      let repl = await this.replicationService.setupReplication(DATA_TYPE.ME, this.db.me, meId);
      repl.error$.subscribe(err => {console.error(err)});

      this.replications[DATA_TYPE.ME] = repl;

      repl = await this.replicationService.setupReplication(DATA_TYPE.LISTS, this.db.lists, meId);
      repl.error$.subscribe(err => {console.error(err)});

      this.replications[DATA_TYPE.LISTS] = repl;

      repl = await this.replicationService.setupReplication(DATA_TYPE.LIST_ITEM, this.db.items, meId);
      repl.error$.subscribe(err => {console.error(err)});

      this.replications[DATA_TYPE.LIST_ITEM] = repl;
    }

    this.dbInitialized = true;
  }

  removeData() {
    if (this.dbInitialized) {
      console.log('remove data');
      this.db.me.remove();
      this.db.lists.remove();
      this.db.items.remove();
      this.dbInitialized = false;
      Object.values(this.replications).forEach(repl => {
        repl.remove();
      });
    }
  }
}
