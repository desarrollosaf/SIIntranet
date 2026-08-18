import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell/app-shell';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

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
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/inicio/pages/inicio-page/inicio-page').then(
            (m) => m.InicioPage,
          ),
      },
      {
        path: 'formatos',
        loadComponent: () =>
          import('./features/formatos/pages/formatos-page/formatos-page').then(
            (m) => m.FormatosPage,
          ),
      },
      {
        path: 'administracion/usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/administracion/pages/usuarios-page/usuarios-page').then(
            (m) => m.UsuariosPage,
          ),
      },
      {
        path: 'mensajes',
        children: [
          {
            path: '',
            redirectTo: 'recibidos',
            pathMatch: 'full',
          },
          {
            path: 'recibidos',
            data: { tipo: 'recibidos' },
            loadComponent: () =>
              import('./features/mensajes/pages/bandeja-mensajes-page/bandeja-mensajes-page').then(
                (m) => m.BandejaMensajesPage,
              ),
          },
          {
            path: 'enviados',
            data: { tipo: 'enviados' },
            loadComponent: () =>
              import('./features/mensajes/pages/bandeja-mensajes-page/bandeja-mensajes-page').then(
                (m) => m.BandejaMensajesPage,
              ),
          },
          {
            path: 'redactar',
            loadComponent: () =>
              import('./features/mensajes/pages/redactar-mensaje-page/redactar-mensaje-page').then(
                (m) => m.RedactarMensajePage,
              ),
          },
          {
            path: ':id/responder',
            loadComponent: () =>
              import('./features/mensajes/pages/redactar-mensaje-page/redactar-mensaje-page').then(
                (m) => m.RedactarMensajePage,
              ),
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./features/mensajes/pages/editar-mensaje-page/editar-mensaje-page').then(
                (m) => m.EditarMensajePage,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/mensajes/pages/detalle-mensaje-page/detalle-mensaje-page').then(
                (m) => m.DetalleMensajePage,
              ),
          },
        ],
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
