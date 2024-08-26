import { APP_INITIALIZER, ApplicationConfig, Injector, LOCALE_ID, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { laravelInterceptor } from './interceptors/laravel-tokens';
import { noConnectionInterceptor } from './interceptors/no-connection';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { initDatabase } from './services/data/init-database';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (injector: Injector) => () => initDatabase(injector),
      multi: true,
      deps: [Injector]
    },
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(withInterceptors([laravelInterceptor, noConnectionInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
        // enabled: true,
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: LOCALE_ID,
      useValue: environment.locale // 'de' for Germany, 'fr' for France ...
    }
]
};
