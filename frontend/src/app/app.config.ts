import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { CookieService } from 'ngx-cookie-service';
import { laravelInterceptor } from './interceptors/laravel-tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    provideAnimations(),
    CookieService,
    provideHttpClient(
      withInterceptors([laravelInterceptor])
    )
]
};
