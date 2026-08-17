import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ArchivosService } from './archivos.service';
import { API_BASE_URL } from '../../../core/http/api.config';
import { Archivo } from '../models/archivo.model';

describe('ArchivosService', () => {
  let service: ArchivosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArchivosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('subir() hace POST a /archivos con un FormData que contiene el mismo File bajo la clave "archivo"', () => {
    const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    const respuestaEsperada: Archivo = {
      id: 'archivo-1',
      nombreOriginal: 'documento.pdf',
      mimeType: 'application/pdf',
      tamano: 9,
      fechaSubida: new Date().toISOString(),
    };

    service.subir(archivo).subscribe((respuesta) => {
      expect(respuesta).toEqual(respuestaEsperada);
    });

    const req = httpMock.expectOne(`${API_BASE_URL}/archivos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);

    const body = req.request.body as FormData;
    expect(body.get('archivo')).toBe(archivo);

    req.flush(respuestaEsperada);
  });
});
