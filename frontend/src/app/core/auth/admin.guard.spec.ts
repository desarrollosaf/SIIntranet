import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from '../models/current-user.model';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function establecerSesion(currentUser: CurrentUser): void {
    (authService as any).currentUserSignal.set(currentUser);
  }

  it('permite el acceso a un Administrador', () => {
    establecerSesion({
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    });

    const resultado = executeGuard({} as any, {} as any);

    expect(resultado).toBe(true);
  });

  it('redirige a /inicio a un Usuario normal', () => {
    establecerSesion({
      id: 'dev-usuario-2',
      nombre: 'Usuario de Prueba Dos',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
    });

    const resultado = executeGuard({} as any, {} as any) as UrlTree;

    expect(router.serializeUrl(resultado)).toBe('/inicio');
  });

  it('redirige a /login sin sesión', () => {
    const resultado = executeGuard({} as any, {} as any) as UrlTree;

    expect(router.serializeUrl(resultado)).toBe('/login');
  });
});
