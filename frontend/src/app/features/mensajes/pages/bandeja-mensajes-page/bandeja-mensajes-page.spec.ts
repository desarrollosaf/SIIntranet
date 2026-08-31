import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BandejaMensajesPage } from './bandeja-mensajes-page';
import { MensajesService } from '../../services/mensajes.service';
import { MensajeEnviado, MensajeRecibido } from '../../models/mensaje.model';

describe('BandejaMensajesPage', () => {
  let fixture: ComponentFixture<BandejaMensajesPage>;
  let mensajesService: MensajesService;
  let routeData: BehaviorSubject<{ tipo?: string }>;

  const recibido: MensajeRecibido = {
    id: 'mensaje-1',
    remitente: { id: 'dev-usuario-1', nombre: 'Usuario Uno', usuario: 'usuario.uno' },
    fechaCreacion: new Date().toISOString(),
    estado: 'Enviado',
    contenidoDisponible: true,
    estadoLectura: 'Nuevo',
    estadoRespuesta: 'Pendiente',
    titulo: 'Asunto',
    descripcion: 'Contenido',
    archivoIds: [],
  };

  const enviado: MensajeEnviado = {
    id: 'mensaje-2',
    fechaCreacion: new Date().toISOString(),
    estado: 'Enviado',
    contenidoDisponible: true,
    destinatarios: [
      {
        usuarioId: 'dev-usuario-2',
        nombre: 'Usuario Dos',
        usuario: 'usuario.dos',
        estadoLectura: 'Nuevo',
        estadoRespuesta: 'Pendiente',
      },
    ],
    titulo: 'Enviado',
    descripcion: 'Contenido',
    archivoIds: [],
  };

  // Configura el módulo de test e inyecta MensajesService SIN instanciar
  // todavía el componente — su constructor dispara la carga inicial de
  // inmediato, así que los spies deben existir antes de crear el fixture.
  function configurar(tipoInicial: 'recibidos' | 'enviados' = 'recibidos'): void {
    routeData = new BehaviorSubject<{ tipo?: string }>({ tipo: tipoInicial });

    TestBed.configureTestingModule({
      imports: [BandejaMensajesPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { data: routeData } },
      ],
    });

    mensajesService = TestBed.inject(MensajesService);
  }

  function crearFixture(): void {
    fixture = TestBed.createComponent(BandejaMensajesPage);
  }

  it('carga recibidos cuando route.data.tipo es "recibidos"', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    expect(mensajesService.recibidos).toHaveBeenCalled();
    expect(fixture.componentInstance['recibidos']()).toEqual([recibido]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('el hero muestra "Bandeja de entrada" con recibidos', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Bandeja de entrada');
  });

  it('carga enviados cuando route.data.tipo es "enviados"', () => {
    configurar('enviados');
    vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([enviado]));
    crearFixture();

    fixture.detectChanges();

    expect(mensajesService.enviados).toHaveBeenCalled();
    expect(fixture.componentInstance['enviados']()).toEqual([enviado]);
  });

  it('el hero sigue mostrando "Bandeja de entrada" con enviados', () => {
    configurar('enviados');
    vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([enviado]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Bandeja de entrada');
  });

  it('muestra un mensaje de error si la carga falla', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBe('No fue posible cargar los mensajes.');
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('un mensaje recibido Nuevo se representa con mayor peso tipográfico en el título', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bandeja-page__fila-titulo--nuevo')).not.toBeNull();
  });

  it('un mensaje Eliminado no intenta mostrar título/descripción', () => {
    configurar('recibidos');
    const eliminado: MensajeRecibido = {
      id: 'mensaje-3',
      remitente: recibido.remitente,
      fechaCreacion: new Date().toISOString(),
      estado: 'Eliminado',
      contenidoDisponible: false,
      estadoLectura: 'Visto',
      estadoRespuesta: 'Pendiente',
    };
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([eliminado]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mensaje eliminado por el remitente');
    expect(compiled.textContent).not.toContain('undefined');
  });

  it('cada fila (no un botón "Ver") enlaza al detalle del mensaje', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const fila = compiled.querySelector('a.bandeja-page__fila[href*="mensaje-1"]');
    expect(fila).not.toBeNull();
  });

  it('ya no existe un botón/enlace de texto "Ver"', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const textos = [
      ...Array.from(compiled.querySelectorAll('a')),
      ...Array.from(compiled.querySelectorAll('button')),
    ].map((el) => el.textContent?.trim());
    expect(textos).not.toContain('Ver');
  });

  it('ya no existe un botón/enlace "Redactar" en la bandeja', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/mensajes/redactar"]')).toBeNull();
    const textos = [
      ...Array.from(compiled.querySelectorAll('a')),
      ...Array.from(compiled.querySelectorAll('button')),
    ].map((el) => el.textContent?.trim());
    expect(textos).not.toContain('Redactar');
  });

  // MICROCORRECCIÓN 15C.3B: Detalle no puede confiar solo en el tipo de
  // mensaje devuelto por el backend para decidir a dónde "volver" (un
  // mensaje enviado a uno mismo se resuelve como MensajeEnviado aunque se
  // abra desde Recibidos) — Bandeja debe propagar el origen real de la
  // navegación como query param en el RouterLink de cada fila. Se verifica
  // el href real calculado por Angular Router tras change detection, no el
  // marcado `[queryParams]` del template.
  describe('propagación de origen a Detalle (MICROCORRECCIÓN 15C.3B)', () => {
    it('en Recibidos, la fila navega al detalle del mensaje con ?origen=recibidos', () => {
      configurar('recibidos');
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const fila = compiled.querySelector<HTMLAnchorElement>('a.bandeja-page__fila[href*="mensaje-1"]');
      expect(fila).not.toBeNull();
      expect(fila!.getAttribute('href')).toBe('/mensajes/mensaje-1?origen=recibidos');
    });

    it('en Enviados, la fila navega al detalle del mensaje con ?origen=enviados', () => {
      configurar('enviados');
      vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([enviado]));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const fila = compiled.querySelector<HTMLAnchorElement>('a.bandeja-page__fila[href*="mensaje-2"]');
      expect(fila).not.toBeNull();
      expect(fila!.getAttribute('href')).toBe('/mensajes/mensaje-2?origen=enviados');
    });
  });

  describe('orden local por fecha', () => {
    function mensaje(id: string, fechaCreacion: string): MensajeRecibido {
      return {
        id,
        remitente: { id: 'dev-usuario-1', nombre: 'Usuario Uno', usuario: 'usuario.uno' },
        fechaCreacion,
        estado: 'Enviado',
        contenidoDisponible: true,
        estadoLectura: 'Nuevo',
        estadoRespuesta: 'Pendiente',
        titulo: 'Asunto',
        descripcion: 'Contenido',
        archivoIds: [],
      };
    }

    it('ordena recibidos por fechaCreacion descendente aunque el backend no lo garantice', () => {
      configurar('recibidos');
      const antiguo = mensaje('antiguo', new Date(2026, 0, 1).toISOString());
      const reciente = mensaje('reciente', new Date(2026, 0, 10).toISOString());
      const intermedio = mensaje('intermedio', new Date(2026, 0, 5).toISOString());
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([antiguo, reciente, intermedio]));
      crearFixture();

      fixture.detectChanges();

      const ids = fixture.componentInstance['recibidos']().map((m) => m.id);
      expect(ids).toEqual(['reciente', 'intermedio', 'antiguo']);
    });

    it('no muta el arreglo original devuelto por el servicio', () => {
      configurar('recibidos');
      const antiguo = mensaje('antiguo', new Date(2026, 0, 1).toISOString());
      const reciente = mensaje('reciente', new Date(2026, 0, 10).toISOString());
      const original = [antiguo, reciente];
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of(original));
      crearFixture();

      fixture.detectChanges();

      expect(original.map((m) => m.id)).toEqual(['antiguo', 'reciente']);
    });
  });

  describe('búsqueda local — Recibidos', () => {
    const uno: MensajeRecibido = {
      id: 'r-1',
      remitente: { id: 'dev-usuario-1', nombre: 'Usuario de Prueba Uno', usuario: 'usuario.prueba.uno' },
      fechaCreacion: new Date(2026, 0, 3).toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
      titulo: 'Circular institucional',
      descripcion: 'Contenido',
      archivoIds: [],
    };

    const dos: MensajeRecibido = {
      id: 'r-2',
      remitente: { id: 'dev-usuario-2', nombre: 'Otra Persona', usuario: 'otra.persona' },
      fechaCreacion: new Date(2026, 0, 2).toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      estadoLectura: 'Visto',
      estadoRespuesta: 'Pendiente',
      titulo: 'Aviso general',
      descripcion: 'Contenido',
      archivoIds: [],
    };

    function configurarConAmbos() {
      configurar('recibidos');
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([uno, dos]));
      crearFixture();
      fixture.detectChanges();
    }

    function buscar(valor: string): void {
      fixture.componentInstance['onBuscar']({ target: { value: valor } } as unknown as Event);
      fixture.detectChanges();
    }

    it('busca por título', () => {
      configurarConAmbos();
      buscar('circular');

      expect(fixture.componentInstance['recibidosFiltrados']().map((m) => m.id)).toEqual(['r-1']);
    });

    it('busca por remitente.nombre', () => {
      configurarConAmbos();
      buscar('Otra Persona');

      expect(fixture.componentInstance['recibidosFiltrados']().map((m) => m.id)).toEqual(['r-2']);
    });

    it('busca por remitente.usuario', () => {
      configurarConAmbos();
      buscar('usuario.prueba');

      expect(fixture.componentInstance['recibidosFiltrados']().map((m) => m.id)).toEqual(['r-1']);
    });

    it('la búsqueda es case-insensitive e ignora espacios exteriores', () => {
      configurarConAmbos();
      buscar('  CIRCULAR  ');

      expect(fixture.componentInstance['recibidosFiltrados']().map((m) => m.id)).toEqual(['r-1']);
    });

    it('sin coincidencias muestra "No se encontraron mensajes." (distinto de la bandeja vacía)', () => {
      configurarConAmbos();
      buscar('zzz-inexistente');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No se encontraron mensajes.');
      expect(compiled.textContent).not.toContain('No tienes mensajes recibidos.');
    });

    it('un mensaje sin contenidoDisponible no intenta leer título en la búsqueda', () => {
      configurar('recibidos');
      const eliminado: MensajeRecibido = {
        id: 'r-3',
        remitente: { id: 'dev-usuario-3', nombre: 'Nombre Buscable', usuario: 'usuario.buscable' },
        fechaCreacion: new Date(2026, 0, 1).toISOString(),
        estado: 'Eliminado',
        contenidoDisponible: false,
        estadoLectura: 'Visto',
        estadoRespuesta: 'Pendiente',
      };
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([eliminado]));
      crearFixture();
      fixture.detectChanges();

      expect(() => buscar('nombre buscable')).not.toThrow();
      expect(fixture.componentInstance['recibidosFiltrados']().map((m) => m.id)).toEqual(['r-3']);
    });
  });

  describe('búsqueda local — Enviados', () => {
    const uno: MensajeEnviado = {
      id: 'e-1',
      fechaCreacion: new Date(2026, 0, 3).toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      destinatarios: [
        { usuarioId: 'u-1', nombre: 'Usuario de Prueba Uno', usuario: 'usuario.prueba.uno', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
      ],
      titulo: 'Circular institucional',
      descripcion: 'Contenido',
      archivoIds: [],
    };

    const dos: MensajeEnviado = {
      id: 'e-2',
      fechaCreacion: new Date(2026, 0, 2).toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      destinatarios: [
        { usuarioId: 'u-2', nombre: 'Otra Persona', usuario: 'otra.persona', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
      ],
      titulo: 'Aviso general',
      descripcion: 'Contenido',
      archivoIds: [],
    };

    function configurarConAmbos() {
      configurar('enviados');
      vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([uno, dos]));
      crearFixture();
      fixture.detectChanges();
    }

    function buscar(valor: string): void {
      fixture.componentInstance['onBuscar']({ target: { value: valor } } as unknown as Event);
      fixture.detectChanges();
    }

    it('busca por título', () => {
      configurarConAmbos();
      buscar('circular');

      expect(fixture.componentInstance['enviadosFiltrados']().map((m) => m.id)).toEqual(['e-1']);
    });

    it('busca por nombre de destinatario', () => {
      configurarConAmbos();
      buscar('Otra Persona');

      expect(fixture.componentInstance['enviadosFiltrados']().map((m) => m.id)).toEqual(['e-2']);
    });

    it('busca por usuario de destinatario', () => {
      configurarConAmbos();
      buscar('usuario.prueba');

      expect(fixture.componentInstance['enviadosFiltrados']().map((m) => m.id)).toEqual(['e-1']);
    });

    it('coincide si CUALQUIERA de varios destinatarios coincide', () => {
      configurar('enviados');
      const conVarios: MensajeEnviado = {
        ...uno,
        id: 'e-3',
        destinatarios: [
          { usuarioId: 'u-1', nombre: 'Primero', usuario: 'primero', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
          { usuarioId: 'u-2', nombre: 'Segundo Buscable', usuario: 'segundo', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
        ],
      };
      vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([conVarios]));
      crearFixture();
      fixture.detectChanges();

      buscar('buscable');

      expect(fixture.componentInstance['enviadosFiltrados']().map((m) => m.id)).toEqual(['e-3']);
    });

    it('sin coincidencias muestra "No se encontraron mensajes."', () => {
      configurarConAmbos();
      buscar('zzz-inexistente');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No se encontraron mensajes.');
      expect(compiled.textContent).not.toContain('No has enviado mensajes.');
    });
  });

  describe('presentación de estados', () => {
    it('estadoRespuesta sigue visible en Recibidos', () => {
      configurar('recibidos');
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Pendiente');
    });

    it('estadoLectura Visto sigue representándose correctamente', () => {
      configurar('recibidos');
      const visto: MensajeRecibido = { ...recibido, estadoLectura: 'Visto' };
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([visto]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.bandeja-page__fila-titulo--nuevo')).toBeNull();
      expect(compiled.textContent).toContain('Visto');
    });

    it('el estado del mensaje sigue visible en Enviados', () => {
      configurar('enviados');
      vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([enviado]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Enviado');
    });

    it('un enviado Eliminado no intenta mostrar título/descripción', () => {
      configurar('enviados');
      const eliminado: MensajeEnviado = {
        id: 'mensaje-4',
        fechaCreacion: new Date().toISOString(),
        estado: 'Eliminado',
        contenidoDisponible: false,
        destinatarios: enviado.destinatarios,
      };
      vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([eliminado]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Mensaje eliminado');
      expect(compiled.textContent).not.toContain('undefined');
    });

    it('con más de dos destinatarios, se muestran los primeros y un contador determinista', () => {
      configurar('enviados');
      const conVarios: MensajeEnviado = {
        ...enviado,
        destinatarios: [
          { usuarioId: 'u-1', nombre: 'Nombre Uno', usuario: 'uno', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
          { usuarioId: 'u-2', nombre: 'Nombre Dos', usuario: 'dos', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
          { usuarioId: 'u-3', nombre: 'Nombre Tres', usuario: 'tres', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
          { usuarioId: 'u-4', nombre: 'Nombre Cuatro', usuario: 'cuatro', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
        ],
      };

      vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([conVarios]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nombre Uno, Nombre Dos y 2 más');
    });
  });
});