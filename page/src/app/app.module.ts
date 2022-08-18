import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { IsLoggedGuard } from './guards/is-logged.guard';
import { ListsOverviewComponent } from './components/lists-overview/lists-overview.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgcCookieConsentModule } from 'ngx-cookieconsent';
import { COOKIE_CONFIG } from './models/cookie-consent-config';
import { JwtInterceptor } from './services/jwt-interceptor/jwt.interceptor';
import { environment } from 'src/environments/environment';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SettingsComponent } from './components/settings/settings.component';
import { AddSheetComponent } from './components/bottom-sheets/add-sheet/add-sheet.component';
import { ListComponent } from './components/list/list.component';
import { UpdateItemSheetComponent } from './components/bottom-sheets/update-item-sheet/update-item-sheet.component';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { ShareListSheetComponent } from './components/bottom-sheets/share-list-sheet/share-list-sheet.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FlatpickrModule } from 'angularx-flatpickr';
import { CacheInterceptor } from './services/cache-interceptor/cache.interceptor';
import { ConfirmSheetComponent } from './components/bottom-sheets/confirm-sheet/confirm-sheet.component';

registerLocaleData(localeDe, 'de');

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ListsOverviewComponent,
    SettingsComponent,
    AddSheetComponent,
    ListComponent,
    UpdateItemSheetComponent,
    ShareListSheetComponent,
    ConfirmSheetComponent,
  ],
  imports: [
    MaterialModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FlatpickrModule.forRoot(),
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgcCookieConsentModule.forRoot(COOKIE_CONFIG),
    ServiceWorkerModule.register('ngsw-worker.js', {
      // enabled: environment.production,
      enabled: true,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerImmediately'
      // registrationStrategy: 'registerWhenStable:3000'
    }),
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi:true},
    {provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi:true},
    {
      provide: LOCALE_ID,
      useValue: environment.locale // 'de' for Germany, 'fr' for France ...
    },
    AuthGuard,
    IsLoggedGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
