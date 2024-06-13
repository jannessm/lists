import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import Pusher from 'pusher-js';

declare var window: any;
window.Pusher = Pusher;

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
