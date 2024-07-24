import { addRxPlugin } from 'rxdb';
import { version } from './version';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

export const environment = {
  production: true,
  api: 'https://lists.magnusso.nz/api/',
  locale: 'de',
  version: version,
  vapid: 'BEQ7Z6AYftjPVg8a554wmJUFeCeR5UAs4eBqWQOUFbbwlbK6qjlbo3TR7GwgpfhJ4TAT2-sGZZQMwkVXRQEdxOI',
  addRxDBPlugins() {
    addRxPlugin(RxDBLeaderElectionPlugin);
    addRxPlugin(RxDBCleanupPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
  },
  getRxStorage() {
    return getRxStorageDexie();
  },
};
