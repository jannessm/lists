import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

import Pusher from 'pusher-js';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

declare var window: any;
window.Pusher = Pusher;


registerLocaleData(localeDe, 'de');

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
