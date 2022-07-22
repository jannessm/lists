import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ManageUserComponent } from './components/manage-user/manage-user.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from './guards/auth.guard';
import { IsLoggedGuard } from './guards/is-logged.guard';
import { ListsOverviewComponent } from './components/lists/lists-overview/lists-overview.component';
import { ListsComponent } from './components/lists/lists.component';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ManageUserComponent,
    PageNotFoundComponent,
    ListsOverviewComponent,
    ListsComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule,
  ],
  providers: [
    AuthGuard,
    IsLoggedGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
