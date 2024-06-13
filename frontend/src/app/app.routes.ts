import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { NgModule } from '@angular/core';
import { authGuard } from './guards/auth/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { CookieComponent } from './components/cookie/cookie.component';
import { isLoggedGuard } from './guards/is-logged/is-logged.guard';

export const routes: Routes = [
    {path: 'user', canActivate: [authGuard], children: [
    //   {path: 'lists', component: ListsOverviewComponent},
    //   {path: 'list/:id', component: ListComponent},
    //   {path: 'settings', component: SettingsComponent},
    ]},
    {path: 'login', component: LoginComponent, canActivate:[isLoggedGuard]},
    {path: 'register', component: RegisterComponent, canActivate:[isLoggedGuard]},
    {path: 'cookies', component: CookieComponent},
    {path: '**', redirectTo: '/login'},
  ];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
export class AppRoutingModule { }