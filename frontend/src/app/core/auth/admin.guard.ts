import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Mejora de navegación/UX únicamente: evita que un Usuario normal navegue a
 * pantallas de administración. La protección real de las operaciones
 * administrativas es el RolesGuard del backend — este guard no la sustituye.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  if (authService.currentUser()?.rol === 'Administrador') {
    return true;
  }

  return router.parseUrl('/inicio');
};
