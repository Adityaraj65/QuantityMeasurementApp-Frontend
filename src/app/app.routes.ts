import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'auth', component: AuthComponent },
  { path: '**', redirectTo: '' }
];
