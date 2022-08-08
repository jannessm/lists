import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { CookieComponent } from './components/cookie/cookie.component';
import { IsLoggedGuard } from './guards/is-logged.guard';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ListsOverviewComponent } from './components/lists/lists-overview/lists-overview.component';
import { ListComponent } from './components/lists/list/list.component';

const routes: Routes = [
  {path: 'user', canActivate: [AuthGuard], children: [
    {path: 'lists', component: ListsOverviewComponent},
    {path: 'list/:id', component: ListComponent},
    {path: 'settings', component: SettingsComponent},
  ]},
  {path: 'login', component: LoginComponent, canActivate:[IsLoggedGuard]},
  {path: 'cookies', component: CookieComponent},
  {path: '', redirectTo: '/user/lists', pathMatch: 'full'},
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
