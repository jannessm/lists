import { Injectable } from '@angular/core';
import { RxDatabase, createRxDatabase } from 'rxdb';

import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { meSchema } from '../../../models/rxdb/me';
import { BehaviorSubject, skip } from 'rxjs';

import { ReplicationService } from '../replication/replication.service';
import { AuthService } from '../auth/auth.service';
import { listsSchema } from '../../../models/rxdb/lists';
import { DATA_TYPE, Replications } from '../../../models/rxdb/graphql-types';
import { listItemSchema } from '../../../models/rxdb/list-item';
import { GroceryCategories } from '../../../models/categories_groceries';
import { HttpClient } from '@angular/common/http';
import { BASE_API } from '../../globals';
import { DB_INSTANCE } from './init-database';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  replications: Replications = {};
  dbInitialized = new BehaviorSubject<boolean>(false);

  groceryCategories: GroceryCategories | undefined;

  constructor(
    private authService: AuthService,
    private replicationService: ReplicationService,
    private http: HttpClient
  ) {
    this.authService.isLoggedIn.pipe(skip(1)).subscribe(isLoggedIn => {
      if (isLoggedIn && !this.dbInitialized.getValue()) {
        this.initDB();
      } else if (!isLoggedIn) {
        this.db?.remove();
        this.dbInitialized.next(false);
      }
    });

    this.http.get<GroceryCategories>(BASE_API + 'grocery-categories').subscribe(cats => {
      this.groceryCategories = cats;
    });
  }

  get db(): RxDatabase {
    return DB_INSTANCE;
  }

  async initDB() {
    Object.values(DATA_TYPE).forEach(async (dataType) => {
      if (this.db) {
        const repl = await this.replicationService.setupReplication(dataType, this.db[dataType]);
        repl.error$.subscribe(err => {console.error(err)});

        this.replications[dataType] = repl;
      }
    });

    this.dbInitialized.next(true);
  }
}
