import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { API_BASE_URL } from '../http/api.config';
import { CurrentUser } from '../models/current-user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('no tiene sesión al iniciar', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login con usuario o contraseña vacíos no hace ninguna petición HTTP y no crea sesión', async () => {
    const resultados = await Promise.all([
      firstValueFrom(service.login('', '')),
      firstValueFrom(service.login('usuario', '')),
      firstValueFrom(service.login('', 'clave')),
      firstValueFrom(service.login('   ', '   ')),
    ]);

    expect(resultados).toEqual([false, false, false, false]);
    httpMock.expectNone(`${API_BASE_URL}/auth/me`);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login válido consulta GET /auth/me y conserva el rol Administrador de la respuesta', async () => {
    const respuestaAdmin: CurrentUser = {
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    };

    const promesa = firstValueFrom(service.login('cualquiera', 'cualquiera'));

    const req = httpMock.expectOne(`${API_BASE_URL}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(respuestaAdmin);

    expect(await promesa).toBe(true);
    expect(service.currentUser()).toEqual(respuestaAdmin);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('login válido conserva el rol Usuario de la respuesta', async () => {
    const respuestaUsuario: CurrentUser = {
      id: 'dev-usuario-2',
      nombre: 'Usuario de Prueba Dos',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
    };

    const promesa = firstValueFrom(service.login('cualquiera', 'cualquiera'));

    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush(respuestaUsuario);

    expect(await promesa).toBe(true);
    expect(service.currentUser()).toEqual(respuestaUsuario);
  });

  it('un error HTTP no crea sesión', async () => {
    const promesa = firstValueFrom(service.login('cualquiera', 'cualquiera'));

    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(await promesa).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('un login fallido posterior a uno exitoso limpia la identidad previa', async () => {
    const respuestaAdmin: CurrentUser = {
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    };

    const primeraPromesa = firstValueFrom(service.login('cualquiera', 'cualquiera'));
    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush(respuestaAdmin);
    expect(await primeraPromesa).toBe(true);
    expect(service.currentUser()).toEqual(respuestaAdmin);

    const segundaPromesa = firstValueFrom(service.login('cualquiera', 'cualquiera'));
    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(await segundaPromesa).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logout limpia la sesión', async () => {
    const promesa = firstValueFrom(service.login('cualquiera', 'cualquiera'));
    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush({
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    });
    await promesa;

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
