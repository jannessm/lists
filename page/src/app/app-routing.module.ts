import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CookieComponent } from './components/cookie/cookie.component';
import { IsLoggedGuard } from './guards/is-logged.guard';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

const routes: Routes = [
  {path: 'register', component: RegisterComponent},
  {path: 'user', canActivate: [AuthGuard], children: [
  ]},
  {path: 'login', component: LoginComponent, canActivate:[IsLoggedGuard]},
  {path: 'cookies', component: CookieComponent},
  {path: '', redirectTo: '/lists', pathMatch: 'full'},
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
