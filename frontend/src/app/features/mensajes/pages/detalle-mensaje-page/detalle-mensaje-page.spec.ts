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
  // `origen` simula el query param `?origen=recibidos|enviados` que Bandeja
  // agrega al enlace de cada fila (MICROCORRECCIÓN 15C.3B); sin argumento,
  // se comporta como una entrada directa sin query param.
  function configurar(origen?: string): void {
    TestBed.configureTestingModule({
      imports: [DetalleMensajePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'mensaje-1' })),
            snapshot: { queryParamMap: convertToParamMap(origen ? { origen } : {}) },
          },
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

  describe('acciones: Responder / Editar / Cancelar / Eliminar', () => {
    const recibidoVisto: MensajeRecibido = { ...recibidoNuevo, estadoLectura: 'Visto' };

    const recibidoEliminado: MensajeRecibido = {
      id: 'mensaje-1',
      remitente: recibidoNuevo.remitente,
      fechaCreacion: new Date().toISOString(),
      estado: 'Eliminado',
      contenidoDisponible: false,
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
    };

    const enviadoEditable: MensajeEnviado = {
      id: 'mensaje-1',
      fechaCreacion: new Date().toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      destinatarios: [
        { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
      ],
      titulo: 'Asunto',
      descripcion: 'Contenido',
      archivoIds: [],
    };

    const enviadoConVisto: MensajeEnviado = {
      ...enviadoEditable,
      destinatarios: [
        { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Visto', estadoRespuesta: 'Pendiente' },
      ],
    };

    const enviadoCancelado: MensajeEnviado = { ...enviadoEditable, estado: 'Cancelado' };

    const enviadoEliminado: MensajeEnviado = {
      id: 'mensaje-1',
      fechaCreacion: new Date().toISOString(),
      estado: 'Eliminado',
      contenidoDisponible: false,
      destinatarios: [
        { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
      ],
    };

    function botonPorTexto(texto: string): HTMLButtonElement | undefined {
      const compiled = fixture.nativeElement as HTMLElement;
      return Array.from(compiled.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === texto,
      );
    }

    function enlacePorTexto(texto: string): HTMLAnchorElement | undefined {
      const compiled = fixture.nativeElement as HTMLElement;
      return Array.from(compiled.querySelectorAll('a')).find((a) => a.textContent?.trim() === texto);
    }

    it('Responder está disponible para un recibido Enviado con contenido disponible', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoVisto));
      vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
      crearFixture();

      fixture.detectChanges();

      const enlace = enlacePorTexto('Responder');
      expect(enlace).toBeTruthy();
      expect(enlace!.getAttribute('href')).toBe('/mensajes/mensaje-1/responder');
    });

    it('Responder no está disponible para un recibido Eliminado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoEliminado));
      crearFixture();

      fixture.detectChanges();

      expect(enlacePorTexto('Responder')).toBeUndefined();
    });

    it('Editar y Cancelar están disponibles cuando el enviado está Enviado y todos los destinatarios Nuevo', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();

      fixture.detectChanges();

      const enlace = enlacePorTexto('Editar');
      expect(enlace).toBeTruthy();
      expect(enlace!.getAttribute('href')).toBe('/mensajes/mensaje-1/editar');
      expect(botonPorTexto('Cancelar')).toBeTruthy();
    });

    it('Editar y Cancelar no están disponibles si algún destinatario ya está Visto', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoConVisto));
      crearFixture();

      fixture.detectChanges();

      expect(enlacePorTexto('Editar')).toBeUndefined();
      expect(botonPorTexto('Cancelar')).toBeUndefined();
    });

    it('Editar y Cancelar no están disponibles para un mensaje Cancelado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoCancelado));
      crearFixture();

      fixture.detectChanges();

      expect(enlacePorTexto('Editar')).toBeUndefined();
      expect(botonPorTexto('Cancelar')).toBeUndefined();
    });

    it('Eliminar está disponible para un enviado Enviado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      expect(botonPorTexto('Eliminar')).toBeTruthy();
    });

    it('Eliminar está disponible para un enviado Cancelado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoCancelado));
      crearFixture();
      fixture.detectChanges();

      expect(botonPorTexto('Eliminar')).toBeTruthy();
    });

    it('Eliminar no está disponible para un mensaje ya Eliminado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEliminado));
      crearFixture();
      fixture.detectChanges();

      expect(botonPorTexto('Eliminar')).toBeUndefined();
    });

    it('Eliminar no está disponible para un recibido', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoVisto));
      vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
      crearFixture();
      fixture.detectChanges();

      expect(botonPorTexto('Eliminar')).toBeUndefined();
    });

    it('Cancelar exitoso llama al servicio y recarga el detalle', () => {
      configurar();
      const obtenerDetalleSpy = vi
        .spyOn(mensajesService, 'obtenerDetalle')
        .mockReturnValueOnce(of(enviadoEditable))
        .mockReturnValueOnce(of(enviadoCancelado));
      vi.spyOn(mensajesService, 'cancelar').mockReturnValue(of({}));
      crearFixture();
      fixture.detectChanges();

      botonPorTexto('Cancelar')!.click();

      expect(mensajesService.cancelar).toHaveBeenCalledWith('mensaje-1');
      expect(obtenerDetalleSpy).toHaveBeenCalledTimes(2);
      expect(fixture.componentInstance['detalle']()).toEqual(enviadoCancelado);
      expect(fixture.componentInstance['procesandoAccion']()).toBe(false);
    });

    it('un fallo al cancelar muestra un error sin destruir el contenido', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      vi.spyOn(mensajesService, 'cancelar').mockReturnValue(throwError(() => new Error('409')));
      crearFixture();
      fixture.detectChanges();

      botonPorTexto('Cancelar')!.click();

      expect(fixture.componentInstance['errorAccion']()).toBe('No fue posible cancelar el mensaje.');
      expect(fixture.componentInstance['detalle']()).toEqual(enviadoEditable);
      expect(fixture.componentInstance['procesandoAccion']()).toBe(false);
    });

    it('Eliminar con confirm() en false no llama al servicio', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      vi.spyOn(mensajesService, 'eliminar');
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      crearFixture();
      fixture.detectChanges();

      botonPorTexto('Eliminar')!.click();

      expect(mensajesService.eliminar).not.toHaveBeenCalled();
    });

    it('Eliminar exitoso recarga el detalle como tombstone', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle')
        .mockReturnValueOnce(of(enviadoEditable))
        .mockReturnValueOnce(of(enviadoEliminado));
      vi.spyOn(mensajesService, 'eliminar').mockReturnValue(of({}));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      crearFixture();
      fixture.detectChanges();

      botonPorTexto('Eliminar')!.click();

      expect(mensajesService.eliminar).toHaveBeenCalledWith('mensaje-1');
      const detalleFinal = fixture.componentInstance['detalle']();
      expect(detalleFinal?.estado).toBe('Eliminado');
      expect(detalleFinal?.contenidoDisponible).toBe(false);
    });
  });

  describe('ETAPA 15C.3B — PageHero, regreso contextual, remitente, destinatarios y tombstone', () => {
    const enviadoConDosDestinatarios: MensajeEnviado = {
      id: 'mensaje-1',
      fechaCreacion: new Date().toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      destinatarios: [
        { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Visto', estadoRespuesta: 'Respondido' },
        { usuarioId: 'dev-usuario-3', nombre: 'Tres', usuario: 'tres', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
      ],
      titulo: 'Asunto',
      descripcion: 'Contenido',
      archivoIds: [],
    };

    it('PageHero muestra "Detalle del mensaje" como único h1', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
      vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('h1').length).toBe(1);
      expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Detalle del mensaje');
    });

    it('el regreso contextual apunta a Recibidos cuando el mensaje es un recibido', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
      vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const enlace = Array.from(compiled.querySelectorAll('a')).find((a) =>
        a.textContent?.includes('Volver a recibidos'),
      );
      expect(enlace).toBeTruthy();
      expect(enlace!.getAttribute('href')).toBe('/mensajes/recibidos');
    });

    it('el regreso contextual apunta a Enviados cuando el mensaje es un enviado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoConDosDestinatarios));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const enlace = Array.from(compiled.querySelectorAll('a')).find((a) =>
        a.textContent?.includes('Volver a enviados'),
      );
      expect(enlace).toBeTruthy();
      expect(enlace!.getAttribute('href')).toBe('/mensajes/enviados');
    });

    it('mientras carga, el regreso por defecto sigue apuntando a Recibidos', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
      vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
      crearFixture();

      // Sin detectChanges todavía: el signal `detalle` sigue en null.
      expect(fixture.componentInstance['volver']()).toEqual({
        texto: 'Volver a recibidos',
        ruta: '/mensajes/recibidos',
      });
    });

    describe('MICROCORRECCIÓN 15C.3B — origen de navegación tiene prioridad sobre el tipo devuelto', () => {
      it('un mensaje enviado a sí mismo (backend devuelve MensajeEnviado) abierto con ?origen=recibidos vuelve a Recibidos', () => {
        configurar('recibidos');
        // El backend resuelve como "enviado" porque remitenteId===actorId,
        // sin importar que el usuario lo haya abierto desde Recibidos.
        vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoConDosDestinatarios));
        crearFixture();

        fixture.detectChanges();

        expect(fixture.componentInstance['volver']()).toEqual({
          texto: 'Volver a recibidos',
          ruta: '/mensajes/recibidos',
        });
        const compiled = fixture.nativeElement as HTMLElement;
        const enlace = Array.from(compiled.querySelectorAll('a')).find((a) =>
          a.textContent?.includes('Volver a recibidos'),
        );
        expect(enlace).toBeTruthy();
        expect(enlace!.getAttribute('href')).toBe('/mensajes/recibidos');
      });

      it('un detalle enviado abierto con ?origen=enviados vuelve a Enviados', () => {
        configurar('enviados');
        vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoConDosDestinatarios));
        crearFixture();

        fixture.detectChanges();

        expect(fixture.componentInstance['volver']()).toEqual({
          texto: 'Volver a enviados',
          ruta: '/mensajes/enviados',
        });
      });

      it('sin query param (entrada directa) conserva el fallback actual basado en el tipo del mensaje', () => {
        configurar();
        vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoConDosDestinatarios));
        crearFixture();

        fixture.detectChanges();

        expect(fixture.componentInstance['volver']()).toEqual({
          texto: 'Volver a enviados',
          ruta: '/mensajes/enviados',
        });
      });

      it('un valor de origen inválido conserva el fallback actual basado en el tipo del mensaje', () => {
        configurar('otra-cosa');
        vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
        vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
        crearFixture();

        fixture.detectChanges();

        expect(fixture.componentInstance['volver']()).toEqual({
          texto: 'Volver a recibidos',
          ruta: '/mensajes/recibidos',
        });
      });
    });

    it('muestra nombre y usuario del remitente para un recibido', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibidoNuevo));
      vi.spyOn(mensajesService, 'marcarVisto').mockReturnValue(of({}));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Usuario Uno');
      expect(compiled.textContent).toContain('usuario.uno');
    });

    it('muestra cada destinatario con su nombre, usuario, estadoLectura y estadoRespuesta individuales', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoConDosDestinatarios));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const filas = compiled.querySelectorAll('.detalle-mensaje-page__destinatario');
      expect(filas.length).toBe(2);
      expect(filas[0].textContent).toContain('Dos');
      expect(filas[0].textContent).toContain('dos');
      expect(filas[0].textContent).toContain('Visto');
      expect(filas[0].textContent).toContain('Respondido');
      expect(filas[1].textContent).toContain('Tres');
      expect(filas[1].textContent).toContain('Nuevo');
      expect(filas[1].textContent).toContain('Pendiente');
    });

    it('tombstone recibido: muestra el aviso seguro y conserva visible el panel de información', () => {
      configurar();
      const eliminado: MensajeRecibido = {
        id: 'mensaje-1',
        remitente: recibidoNuevo.remitente,
        fechaCreacion: new Date().toISOString(),
        estado: 'Eliminado',
        contenidoDisponible: false,
        estadoLectura: 'Visto',
        estadoRespuesta: 'Pendiente',
      };
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(eliminado));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Mensaje eliminado por el remitente.');
      expect(compiled.textContent).not.toContain('undefined');
      // El remitente sigue expuesto por el contrato incluso con
      // contenidoDisponible=false — el panel de información no se oculta.
      expect(compiled.textContent).toContain('Usuario Uno');
      expect(compiled.textContent).toContain('Lectura: Visto');
    });

    it('tombstone enviado: muestra el aviso seguro y conserva visibles estado y destinatarios', () => {
      configurar();
      const eliminado: MensajeEnviado = {
        id: 'mensaje-1',
        fechaCreacion: new Date().toISOString(),
        estado: 'Eliminado',
        contenidoDisponible: false,
        destinatarios: [
          { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Visto', estadoRespuesta: 'Pendiente' },
        ],
      };
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(eliminado));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Mensaje eliminado.');
      expect(compiled.textContent).not.toContain('undefined');
      expect(compiled.textContent).toContain('Eliminado');
      expect(compiled.textContent).toContain('Dos');
    });
  });
});
