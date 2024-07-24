import { addRxPlugin } from 'rxdb';
import { version } from './version';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  api: 'http://127.0.0.1:8080/',
  locale: 'de',
  version: version,
  vapid: 'BEQ7Z6AYftjPVg8a554wmJUFeCeR5UAs4eBqWQOUFbbwlbK6qjlbo3TR7GwgpfhJ4TAT2-sGZZQMwkVXRQEdxOI',
  addRxDBPlugins() {
    addRxPlugin(RxDBDevModePlugin);
    addRxPlugin(RxDBLeaderElectionPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
  },
  getRxStorage() {
    return wrappedValidateAjvStorage({
      storage: getRxStorageDexie()
    });
  },
};
