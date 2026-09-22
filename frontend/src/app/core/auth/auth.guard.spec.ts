import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('con sesión activa permite el acceso', () => {
    (authService as any).currentUserSignal.set({
      id: 'dev-usuario-2',
      nombre: 'sergio',
      usuario: 'sergio',
      rol: 'Usuario',
    });

    const resultado = executeGuard({} as any, {} as any);

    expect(resultado).toBe(true);
  });

  it('sin sesión redirige a /login', () => {
    const resultado = executeGuard({} as any, {} as any);

    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
