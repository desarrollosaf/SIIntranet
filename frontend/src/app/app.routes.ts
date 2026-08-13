import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell/app-shell';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then(
        (m) => m.LoginPage,
      ),
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
