import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('con sesión activa permite el acceso', () => {
    authService.login('sergio', 'clave123');

    const resultado = executeGuard({} as any, {} as any);

    expect(resultado).toBe(true);
  });

  it('sin sesión redirige a /login', () => {
    const resultado = executeGuard({} as any, {} as any);

    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
