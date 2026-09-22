import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { FormatosService } from './formatos.service';
import { API_BASE_URL } from '../../../core/http/api.config';

describe('FormatosService', () => {
  let service: FormatosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FormatosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listar() hace GET a /formatos', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/formatos`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listar() devuelve la respuesta tipada tal como llega', () => {
    const respuesta = [
      {
        id: 'formato-1',
        nombre: 'Solicitud de vacaciones',
        descripcion: 'Formato para solicitar días',
        categoria: 'Recursos Humanos',
        fechaCreacion: '2026-01-01T00:00:00.000Z',
        estado: 'Activo' as const,
        archivo: {
          id: 'archivo-1',
          nombreOriginal: 'solicitud.pdf',
          mimeType: 'application/pdf',
          tamano: 1024,
          fechaSubida: '2026-01-01T00:00:00.000Z',
        },
      },
    ];

    let recibido: unknown;
    service.listar().subscribe((formatos) => (recibido = formatos));

    const req = httpMock.expectOne(`${API_BASE_URL}/formatos`);
    req.flush(respuesta);

    expect(recibido).toEqual(respuesta);
  });

  it('urlDescarga() construye la URL correcta', () => {
    const url = service.urlDescarga('formato-1');

    expect(url).toBe(`${API_BASE_URL}/formatos/formato-1/descarga`);
  });
});
