import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { LoginComponent } from './components/login/login.component';
import { ManageUserComponent } from './components/manage-user/manage-user.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from './guards/auth.guard';
import { IsLoggedGuard } from './guards/is-logged.guard';
import { ListsOverviewComponent } from './components/lists/lists-overview/lists-overview.component';
import { ListsComponent } from './components/lists/lists.component';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NgcCookieConsentModule } from 'ngx-cookieconsent';
import { COOKIE_CONFIG } from './models/cookie-consent-config';
import { JwtInterceptor } from './services/jwt-interceptor/jwt.interceptor';
import { environment } from 'src/environments/environment';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ManageUserComponent,
    PageNotFoundComponent,
    ListsOverviewComponent,
    ListsComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FlexLayoutModule,
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule,
    NgcCookieConsentModule.forRoot(COOKIE_CONFIG),
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi:true},
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
