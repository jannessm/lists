import { version } from './version';

export const environment = {
  production: true,
  api: 'https://lists.magnusso.nz/',
  pusher: {
    url: 'lists-wss.magnusso.nz',
    port: 443,
    appKey: '5zuf2xP79HX9T'
  },
  dexieDebugMode: false,
  hcaptcha: '06a2b0dc-e686-453e-8db2-9c9e40402054',
  locale: 'de',
  version: version,
  vapid: 'BA5fa13vuI6jMC00zKDRhNdwWK-MZH8tA2QL1of4Jw6AfN8g_B3jSaBSraU_jXlaiGDXLxDarXiOPE9eiR1FiWg',
};
