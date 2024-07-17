import { Injectable } from '@angular/core';
import { RxDatabase, addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBCleanupPlugin} from 'rxdb/plugins/cleanup';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

/**
 * IMPORTANT: RxDB creates rxjs observables outside of angulars zone
 * So you have to import the rxjs patch to ensure changedetection works correctly.
 * @link https://www.bennadel.com/blog/3448-binding-rxjs-observable-sources-outside-of-the-ngzone-in-angular-6-0-2.htm
 */
import 'zone.js/plugins/zone-patch-rxjs';

import { meSchema } from '../../../models/rxdb/me';
import { RxReplicationState } from 'rxdb/dist/types/plugins/replication';
import { BehaviorSubject, skip } from 'rxjs';

import { ReplicationService } from '../replication/replication.service';
import { AuthService } from '../auth/auth.service';
import { listsSchema } from '../../../models/rxdb/lists';
import { DATA_TYPE, Replications } from '../../../models/rxdb/graphql-types';
import { listItemSchema } from '../../../models/rxdb/list-item';
import { GroceryCategories } from '../../../models/categories_groceries';
import { HttpClient } from '@angular/common/http';
import { BASE_API } from '../../globals';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  db: RxDatabase | undefined;
  replications: Replications = {};
  dbInitialized = new BehaviorSubject<boolean>(false);

  groceryCategories: GroceryCategories | undefined;

  constructor(
    private authService: AuthService,
    private replicationService: ReplicationService,
    private http: HttpClient,
  ) {
    this.authService.isLoggedIn.pipe(skip(1)).subscribe(isLoggedIn => {
      if (isLoggedIn && !this.dbInitialized.getValue()) {
        this.initDB();
      } else if (!isLoggedIn) {
        this.db?.destroy();
        this.dbInitialized.next(false);
      }
    });

    this.http.get<GroceryCategories>(BASE_API + 'grocery-categories').subscribe(cats => {
      this.groceryCategories = cats;
    });
  }

  async initDB() {
    this.db = await createRxDatabase({
      name: 'db',
      storage: getRxStorageDexie({
        addons: [],
      })
    });

    await this.db.addCollections({
      me: {
        schema: meSchema
      },
      lists: {
        schema: listsSchema
      },
      items: {
        schema: listItemSchema
      }
    });

    Object.values(DATA_TYPE).forEach(async (dataType) => {
      console.log(dataType);
      if (this.db) {
        const repl = await this.replicationService.setupReplication(dataType, this.db[dataType]);
        repl.error$.subscribe(err => {console.error(err)});

        this.replications[dataType] = repl;
      }
    });

    this.dbInitialized.next(true);
  }
}
