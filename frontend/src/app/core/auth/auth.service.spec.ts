import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('no tiene sesión al iniciar', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login con usuario o contraseña vacíos no crea sesión', () => {
    expect(service.login('', '')).toBe(false);
    expect(service.login('usuario', '')).toBe(false);
    expect(service.login('', 'clave')).toBe(false);
    expect(service.login('   ', '   ')).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login provisional válido crea CurrentUser con rol Usuario', () => {
    const resultado = service.login('sergio', 'clave123');

    expect(resultado).toBe(true);
    expect(service.currentUser()).toEqual({ nombre: 'sergio', rol: 'Usuario' });
    expect(service.isAuthenticated()).toBe(true);
  });

  it('la contraseña no forma parte de CurrentUser', () => {
    service.login('sergio', 'clave123');

    const usuario = service.currentUser() as unknown as Record<string, unknown>;
    expect(usuario['password']).toBeUndefined();
    expect(Object.keys(usuario)).toEqual(['nombre', 'rol']);
  });

  it('logout limpia la sesión', () => {
    service.login('sergio', 'clave123');
    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
