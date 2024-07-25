import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { CookieComponent } from './components/cookie/cookie.component';
import { isLoggedGuard } from './guards/is-logged/is-logged.guard';
import { ListsOverviewComponent } from './components/lists-overview/lists-overview.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ListComponent } from './components/list/list.component';

export const routes: Routes = [
    {path: 'user', canActivate: [authGuard], children: [
      {path: 'lists', component: ListsOverviewComponent},
      {path: 'lists/:id', component: ListComponent},
      {path: 'settings', component: SettingsComponent},
    ]},
    {path: 'login', component: LoginComponent, canActivate:[isLoggedGuard]},
    {path: 'register', component: RegisterComponent, canActivate:[isLoggedGuard]},
    {path: 'forgot-password', component: ForgotPasswordComponent, canActivate:[isLoggedGuard]},
    {path: 'reset-password', component: ResetPasswordComponent, canActivate:[isLoggedGuard]},
    {path: 'cookies', component: CookieComponent},
    {path: '**', redirectTo: '/login'},
  ];