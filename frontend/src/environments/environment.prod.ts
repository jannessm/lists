import { version } from './version';

export const environment = {
  production: true,
  api: 'https://lists.magnusso.nz/',
  pusher: {
    url: 'lists-wss.magnusso.nz',
    port: 443,
    appId: 'lists'
  },
  dexieDebugMode: false,
  hcaptcha: '06a2b0dc-e686-453e-8db2-9c9e40402054',
  locale: 'de',
  version: version,
  vapid: 'BN3Iox_of6ZXwyqIVTjqqQLpVqCM26gqKMTW5jugWdSexPZex3PfEBXNcJryRWkSOOv7S5g_b62fztxVtqDCNfI',
};
