import { ApplicationConfig, LOCALE_ID, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClientModule } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { CookieService } from 'ngx-cookie-service';
import { laravelInterceptor } from './interceptors/laravel-tokens';
import { noConnectionInterceptor } from './interceptors/no-connection';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    CookieService,
    provideHttpClient(withInterceptors([laravelInterceptor, noConnectionInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    }),
    {
      provide: LOCALE_ID,
      useValue: environment.locale // 'de' for Germany, 'fr' for France ...
    }
]
};
