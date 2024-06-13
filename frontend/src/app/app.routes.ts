import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { NgModule } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth/auth.guard';
import { RegisterComponent } from './components/register/register.component';


export const routes: Routes = [
    {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
    {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: '**', redirectTo: '/login'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }