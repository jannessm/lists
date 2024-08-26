import { version } from './version';
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  api: 'http://localhost:8080/',
  pusherUrl: 'localhost',
  dexieDebugMode: false,
  hcaptcha: '10000000-ffff-ffff-ffff-000000000001',
  locale: 'de',
  version: version,
  vapid: 'BEQ7Z6AYftjPVg8a554wmJUFeCeR5UAs4eBqWQOUFbbwlbK6qjlbo3TR7GwgpfhJ4TAT2-sGZZQMwkVXRQEdxOI',
};
