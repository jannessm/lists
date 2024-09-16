import { version } from './version';

export const environment = {
  production: true,
  api: 'https://lists-staging.magnusso.nz/',
  pusher: {
    url: 'lists-staging-wss.magnusso.nz',
    port: 443,
    appId: 'app-key'
  },
  dexieDebugMode: false,
  hcaptcha: '06a2b0dc-e686-453e-8db2-9c9e40402054',
  locale: 'de',
  version: version,
  vapid: 'BP_6-nx9gAkQu0FbpjUH3EjQNePCH5hJhD9gepQRrHArsHshyUuxzM_PvxOQuGKfBllwzIEHfrH32e_5xDLgFEw',
};
