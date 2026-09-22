import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

import { LoginPage } from './login-page';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_BASE_URL } from '../../../../core/http/api.config';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formulario inválido no intenta login ni navegación', () => {
    vi.spyOn(authService, 'login');

    (component as any).onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    httpMock.expectNone(`${API_BASE_URL}/auth/me`);
  });

  it('submit válido llama a AuthService.login', () => {
    vi.spyOn(authService, 'login');

    (component as any).form.setValue({ usuario: 'sergio', password: 'clave123' });
    (component as any).onSubmit();

    expect(authService.login).toHaveBeenCalledWith('sergio', 'clave123');

    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush({
      id: 'dev-usuario-1',
      nombre: 'sergio',
      usuario: 'sergio',
      rol: 'Usuario',
    });
  });

  it('login exitoso navega a /', () => {
    (component as any).form.setValue({ usuario: 'sergio', password: 'clave123' });
    (component as any).onSubmit();

    httpMock.expectOne(`${API_BASE_URL}/auth/me`).flush({
      id: 'dev-usuario-1',
      nombre: 'sergio',
      usuario: 'sergio',
      rol: 'Usuario',
    });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('un error HTTP muestra el mensaje genérico y no navega', () => {
    (component as any).form.setValue({ usuario: 'sergio', password: 'clave123' });
    (component as any).onSubmit();

    httpMock
      .expectOne(`${API_BASE_URL}/auth/me`)
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect((component as any).loginFallido).toBe(true);
  });
});
