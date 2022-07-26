import Dexie, { Table } from 'dexie';

export enum HttpRequestType {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE'
}

export interface CachedQuery {
  requested: number;
  uri: string;
  payload: any;
  requestType: HttpRequestType;
}

export class AppDB extends Dexie {
  cachedGets!: Table<CachedQuery, string>;
  cachedQueries!: Table<CachedQuery, string>;

  userEmail: string | undefined;

  constructor() {
    super('db');
    this.version(3).stores({
      cachedGets: 'uri',
      cachedQueries: 'uri',
    });
  }

  async put(uri: string, payload: any, requestType: HttpRequestType) {
    let table = db.cachedGets;

    if (requestType !== HttpRequestType.GET) {
      table = db.cachedQueries;
    }
    
    await table.put({
      uri,
      payload,
      requestType,
      requested: new Date().getTime()
    }, 'uri');
  }

  async get(uri: string, requestType: HttpRequestType) {
    let table = this.cachedGets;
    if (requestType !== HttpRequestType.GET) {
      table = this.cachedQueries;
    }

    return await table.where({uri}).reverse().sortBy('requested');
  }

  clear() {
    this.cachedGets.clear();
    this.cachedQueries.clear();
  }
}

export const db = new AppDB();