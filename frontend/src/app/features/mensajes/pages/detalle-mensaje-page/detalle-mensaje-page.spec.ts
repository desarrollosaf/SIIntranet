import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { DetalleMensajePage } from './detalle-mensaje-page';
import { MensajesService } from '../../services/mensajes.service';
import { MensajeEnviado, MensajeRecibido } from '../../models/mensaje.model';

describe('DetalleMensajePage', () => {
  let fixture: ComponentFixture<DetalleMensajePage>;
  let mensajesService: MensajesService;

  const recibidoNuevo: MensajeRecibido = {
    id: 'mensaje-1',
    remitente: { id: 'dev-usuario-1', nombre: 'Usuario Uno', usuario: 'usuario.uno' },
    fechaCreacion: new Date().toISOString(),
    estado: 'Enviado',
    contenidoDisponible: true,
    estadoLectura: 'Nuevo',
    estadoRespuesta: 'Pendiente',
    titulo: 'Asunto',
    descripcion: 'Contenido',
    archivoIds: ['archivo-1', 'archivo-2'],
  };

  // Configura el módulo de test e inyecta MensajesService SIN instanciar
  // todavía el componente — su constructor dispara la carga inicial de
  // inmediato, así que los spies deben existir antes de crear el fixture.
  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [DetalleMensajePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'mensaje-1' })) },
        },
      ],
    });

    mensajesService = TestBed.inject(MensajesService);
  }

  function crearFixture(): void {
    fixture = TestBed.createComponent(DetalleMensajePage);
  }

  it('carga el detalle del mensaje', () => {
    configurar();
    // Sin marcarVisto mockeado con éxito para no mutar el estado leído aquí
    // (ese efecto se prueba por separado más abajo).
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
    vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(throwError(() => new Error('no relevante')));
    crearFixture();

    fixture.detectChanges();

    expect(mensajesService.obtenerDetalle).toHaveBeenCalledWith('mensaje-1');
    expect(fixture.componentInstance['detalle']()).toEqual(recibidoNuevo);
  });

  it('un recibido Nuevo llama marcarVisto después de obtener el detalle', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
    const spyVisto = vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
    crearFixture();

    fixture.detectChanges();

    expect(spyVisto).toHaveBeenCalledWith('mensaje-1');
  });

  it('un recibido ya Visto no vuelve a llamar marcarVisto', () => {
    configurar();
    const recibidoVisto: MensajeRecibido = { ...recibidoNuevo, estadoLectura: 'Visto' };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoVisto));
    const spyVisto = vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
    crearFixture();

    fixture.detectChanges();

    expect(spyVisto).not.toHaveBeenCalled();
  });

  it('un mensaje enviado no llama marcarVisto', () => {
    configurar();
    const enviado: MensajeEnviado = {
      id: 'mensaje-1',
      fechaCreacion: new Date().toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      destinatarios: [],
      titulo: 'Asunto',
      descripcion: 'Contenido',
      archivoIds: [],
    };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviado));
    const spyVisto = vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
    crearFixture();

    fixture.detectChanges();

    expect(spyVisto).not.toHaveBeenCalled();
  });

  it('un mensaje Eliminado (tombstone) no llama marcarVisto', () => {
    configurar();
    const eliminado: MensajeRecibido = {
      id: 'mensaje-1',
      remitente: recibidoNuevo.remitente,
      fechaCreacion: new Date().toISOString(),
      estado: 'Eliminado',
      contenidoDisponible: false,
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
    };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(eliminado));
    const spyVisto = vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
    crearFixture();

    fixture.detectChanges();

    expect(spyVisto).not.toHaveBeenCalled();
  });

  it('los adjuntos generan enlaces vía el endpoint de descarga de Mensajería', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
    vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlaces = Array.from(compiled.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toContain(mensajesService.urlDescargaAdjunto('mensaje-1', 'archivo-1'));
    expect(enlaces).toContain(mensajesService.urlDescargaAdjunto('mensaje-1', 'archivo-2'));
  });

  it('un error al marcar visto no destruye el detalle ya mostrado', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
    vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance['detalle']()).toEqual(recibidoNuevo);
    expect(fixture.componentInstance['avisoVisto']()).toBeTruthy();
  });
});
