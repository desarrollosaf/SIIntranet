import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UsuariosService } from './usuarios.service';
import { API_BASE_URL } from '../../../core/http/api.config';
import { Usuario } from '../models/usuario.model';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;

  const usuarioEjemplo: Usuario = {
    id: 'dev-usuario-1',
    nombre: 'Usuario de Prueba Uno',
    usuario: 'usuario.prueba.uno',
    rol: 'Administrador',
    estado: 'Activo',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listar() hace GET a /usuarios', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/usuarios`);
    expect(req.request.method).toBe('GET');
    req.flush([usuarioEjemplo]);
  });

  it('obtenerPorId() hace GET a /usuarios/:id', () => {
    service.obtenerPorId('dev-usuario-1').subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/usuarios/dev-usuario-1`);
    expect(req.request.method).toBe('GET');
    req.flush(usuarioEjemplo);
  });

  it('actualizar() hace PATCH a /usuarios/:id con el body correcto', () => {
    const datos = { nombre: 'Nuevo nombre' };

    service.actualizar('dev-usuario-1', datos).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/usuarios/dev-usuario-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(datos);
    req.flush({ ...usuarioEjemplo, ...datos });
  });

  it('cambiarEstado() hace PATCH a /usuarios/:id/estado con el body correcto', () => {
    service.cambiarEstado('dev-usuario-1', 'Inactivo').subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/usuarios/dev-usuario-1/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'Inactivo' });
    req.flush({ ...usuarioEjemplo, estado: 'Inactivo' });
  });
});
