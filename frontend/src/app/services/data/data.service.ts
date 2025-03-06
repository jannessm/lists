import { Injectable, OnDestroy } from '@angular/core';

import { ReplicationService } from '../replication/replication.service';
import { DATA_TYPE } from '../../mydb/types/graphql-types';
import { GroceryCategories } from '../../../models/categories_groceries';
import { HttpClient } from '@angular/common/http';
import { BASE_API } from '../../globals';
import { DB_INSTANCE } from './init-database';
import { AddCollectionsOptions, MyListsCollections } from '../../mydb/types/database';
import { Replicator } from '../../mydb/replication';
import { PusherService } from '../pusher/pusher.service';
import Dexie from 'dexie';
import { DB_CONFIG } from './db-config';
import { MyCollection } from '../../mydb/collection';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private dexie!: Dexie;
  public db!: MyListsCollections;
  public schema!: AddCollectionsOptions;
  replications: {[key: string]: Replicator} = {};

  dbInitialized = false;

  groceryCategories: GroceryCategories | undefined;

  constructor(
    private replicationService: ReplicationService,
    private http: HttpClient,
    private pusherService: PusherService,
  ) {
    this.dexie = DB_INSTANCE;
    this.addCollections(DB_CONFIG);

    this.http.get<GroceryCategories>(BASE_API + 'grocery-categories').subscribe(cats => {
      this.groceryCategories = cats;
    });
  }

  resync(collection?: DATA_TYPE) {
    if (collection && this.dbInitialized) {
      this.replicationService.streamSubjects[collection].next("RESYNC");
    } else if (this.dbInitialized) {
      Object.values(this.replicationService.streamSubjects).forEach(subj => {
        subj.next('RESYNC');
      });
    }
  }

  async initDB() {
    if (this.db && !this.dbInitialized) {
      await new Promise((resolve, rej) => {
        const checkInterval = setInterval(() => {
          if (this.pusherService.socketID) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
      });

      let repl = await this.replicationService.setupReplication(DATA_TYPE.LISTS, this.db.lists);
      this.replications[DATA_TYPE.LISTS] = repl;
      
      repl = await this.replicationService.setupReplication(DATA_TYPE.LIST_ITEM, this.db.items);
      this.replications[DATA_TYPE.LIST_ITEM] = repl;

      repl = await this.replicationService.setupReplication(DATA_TYPE.ME, this.db.me);
      this.replications[DATA_TYPE.ME] = repl;
      
      repl = await this.replicationService.setupReplication(DATA_TYPE.USERS, this.db.users);
      this.replications[DATA_TYPE.USERS] = repl;
    }

    this.dbInitialized = true;
  }

  addCollections(options: AddCollectionsOptions) {
    this.schema = options;
    this.db = {
      [DATA_TYPE.ME]: new MyCollection(this.dexie,
                                       DATA_TYPE.ME,
                                       options[DATA_TYPE.ME].schema,
                                       options[DATA_TYPE.ME].methods,
                                       options[DATA_TYPE.ME].conflictHandler),
      [DATA_TYPE.USERS]: new MyCollection(this.dexie,
                                          DATA_TYPE.USERS,
                                          options[DATA_TYPE.USERS].schema,
                                          options[DATA_TYPE.USERS].methods,
                                          options[DATA_TYPE.USERS].conflictHandler),
      [DATA_TYPE.LISTS]: new MyCollection(this.dexie,
                                          DATA_TYPE.LISTS,
                                          options[DATA_TYPE.LISTS].schema,
                                          options[DATA_TYPE.LISTS].methods,
                                          options[DATA_TYPE.LISTS].conflictHandler),
      [DATA_TYPE.LIST_ITEM]: new MyCollection(this.dexie,
                                              DATA_TYPE.LIST_ITEM,
                                              options[DATA_TYPE.LIST_ITEM].schema,
                                              options[DATA_TYPE.LIST_ITEM].methods,
                                              options[DATA_TYPE.LIST_ITEM].conflictHandler),
    };
  }

  async removeData() {
    if (this.dbInitialized) {
      Object.values(this.replications).forEach(repl => {
        repl.destroy();
      });
      await this.db.me.remove();
      await this.db.users.remove();
      await this.db.lists.remove();
      await this.db.items.remove();
      this.dbInitialized = false;
    }
  }
}
