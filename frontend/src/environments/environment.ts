import { version } from './version';
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  api: 'http://localhost:8080/',
  pusher: {
    url: 'localhost',
    port: 6001,
    appId: 'app-key'
  },
  dexieDebugMode: false,
  hcaptcha: '10000000-ffff-ffff-ffff-000000000001',
  locale: 'de',
  version: version,
  vapid: 'BP_6-nx9gAkQu0FbpjUH3EjQNePCH5hJhD9gepQRrHArsHshyUuxzM_PvxOQuGKfBllwzIEHfrH32e_5xDLgFEw',
};
