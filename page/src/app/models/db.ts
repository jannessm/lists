import Dexie, { Table } from 'dexie';

export enum HttpRequestType {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE'
}

export interface CachedQuery {
  uri: string;
  payload: any;
  requestType: HttpRequestType;
}

export class AppDB extends Dexie {
  cachedQueries!: Table<CachedQuery, string>;

  constructor() {
    super('ngdexieliveQuery');
    this.version(3).stores({
      cachedQueries: 'uri',
    });
  }

  async put(uri: string, payload: any, requestType: HttpRequestType) {
    await db.cachedQueries.put({
      uri,
      payload,
      requestType
    }, 'uri');
  }

  async get(uri: string) {
    return await db.cachedQueries.where({uri}).toArray()
  }
}

export const db = new AppDB();