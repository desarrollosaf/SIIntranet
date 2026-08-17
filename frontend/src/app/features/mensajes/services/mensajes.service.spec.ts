import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MensajesService } from './mensajes.service';
import { API_BASE_URL } from '../../../core/http/api.config';

describe('MensajesService', () => {
  let service: MensajesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MensajesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('recibidos() hace GET a /mensajes/recibidos', () => {
    service.recibidos().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/recibidos`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('enviados() hace GET a /mensajes/enviados', () => {
    service.enviados().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/enviados`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('obtenerDetalle() hace GET a /mensajes/:id', () => {
    service.obtenerDetalle('mensaje-1').subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/mensaje-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('crear() hace POST a /mensajes con el body exacto', () => {
    const datos = {
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
      archivoIds: ['archivo-1'],
    };

    service.crear(datos).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush({});
  });

  it('marcarVisto() hace PATCH a /mensajes/:id/visto con body vacío', () => {
    service.marcarVisto('mensaje-1').subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/mensaje-1/visto`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('crear() con respuestaAId conserva ese campo en el body', () => {
    const datos = {
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
      archivoIds: ['archivo-1'],
      respuestaAId: 'mensaje-original',
    };

    service.crear(datos).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush({});
  });

  it('actualizar() hace PATCH a /mensajes/:id con el body exacto', () => {
    const datos = {
      titulo: 'Nuevo título',
      descripcion: 'Nueva descripción',
      destinatarioIds: ['dev-usuario-2'],
      archivoIds: ['archivo-1'],
    };

    service.actualizar('mensaje-1', datos).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/mensaje-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(datos);
    req.flush({});
  });

  it('cancelar() hace PATCH a /mensajes/:id/cancelar con body vacío', () => {
    service.cancelar('mensaje-1').subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/mensaje-1/cancelar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('eliminar() hace PATCH a /mensajes/:id/eliminar con body vacío', () => {
    service.eliminar('mensaje-1').subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/mensajes/mensaje-1/eliminar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('urlDescargaAdjunto() construye la URL correcta', () => {
    const url = service.urlDescargaAdjunto('mensaje-1', 'archivo-1');

    expect(url).toBe(`${API_BASE_URL}/mensajes/mensaje-1/adjuntos/archivo-1/descarga`);
  });
});
