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

import { Task, meSchema } from '../../../models/rxdb/me';
import { RxReplicationState } from 'rxdb/dist/types/plugins/replication';
import { BehaviorSubject } from 'rxjs';

import { ReplicationService } from '../replication/replication.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  db: RxDatabase | undefined;
  replication: RxReplicationState<Task, unknown> | undefined;
  dbInitialized = new BehaviorSubject<boolean>(false);

  constructor(
    private authService: AuthService,
    private replicationService: ReplicationService
  ) {
    this.authService.isLoggedIn.subscribe(isLoggedIn => {
      if (isLoggedIn && !this.dbInitialized.getValue()) {
        this.initDB();
      }
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
      }
    });

    this.replication = await this.replicationService.setupReplication('me', this.db['me']);
    this.replication.error$.subscribe(console.error);

    this.dbInitialized.next(true);
  }
}
