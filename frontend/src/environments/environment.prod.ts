import { version } from './version';

export const environment = {
  production: true,
  api: 'https://lists.magnusso.nz/',
  pusherUrl: 'lists-wss.magnusso.nz',
  pusherPort: 443,
  dexieDebugMode: false,
  hcaptcha: '06a2b0dc-e686-453e-8db2-9c9e40402054',
  locale: 'de',
  version: version,
  vapid: 'BEQ7Z6AYftjPVg8a554wmJUFeCeR5UAs4eBqWQOUFbbwlbK6qjlbo3TR7GwgpfhJ4TAT2-sGZZQMwkVXRQEdxOI',
};
