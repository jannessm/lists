import { Injectable } from '@angular/core';

import { ReplicationService } from '../replication/replication.service';
import { DATA_TYPE } from '../../mydb/types/graphql-types';
import { GroceryCategories } from '../../../models/categories_groceries';
import { HttpClient } from '@angular/common/http';
import { BASE_API } from '../../globals';
import { DB_INSTANCE } from './init-database';
import { MyListsDatabase } from '../../mydb/types/database';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  replications: any = {};
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

  get db(): MyListsDatabase {
    return DB_INSTANCE;
  }

  async initDB(meId: string | null) {
    if (this.db && !this.dbInitialized) {
      let repl = await this.replicationService.setupReplication(DATA_TYPE.ME, this.db.me, meId);
      // repl.error$.subscribe(err => {console.error(err)});

      this.replications[DATA_TYPE.ME] = repl;

      repl = await this.replicationService.setupReplication(DATA_TYPE.LISTS, this.db.lists, meId);
      // repl.error$.subscribe(err => {console.error(err)});

      this.replications[DATA_TYPE.LISTS] = repl;

      repl = await this.replicationService.setupReplication(DATA_TYPE.LIST_ITEM, this.db.items, meId);
      // repl.error$.subscribe(err => {console.error(err)});

      this.replications[DATA_TYPE.LIST_ITEM] = repl;
    }

    this.dbInitialized = true;
  }

  async removeData() {
    if (this.dbInitialized) {
      console.log('remove data');
      // Object.values(this.replications).forEach(repl => {
      //   repl.remove();
      // });
      await this.db.me.remove();
      await this.db.lists.remove();
      await this.db.items.remove();
      this.dbInitialized = false;
    }
  }
}
