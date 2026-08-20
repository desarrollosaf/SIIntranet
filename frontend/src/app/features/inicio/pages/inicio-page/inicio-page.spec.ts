import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InicioPage } from './inicio-page';
import { AuthService } from '../../../../core/auth/auth.service';
import { MensajesService } from '../../../mensajes/services/mensajes.service';
import { MensajeRecibido } from '../../../mensajes/models/mensaje.model';
import { UserRole } from '../../../../core/models/current-user.model';

describe('InicioPage', () => {
  let fixture: ComponentFixture<InicioPage>;
  let authService: AuthService;
  let mensajesService: MensajesService;

  function mensaje(datos: Partial<MensajeRecibido> & { id: string }): MensajeRecibido {
    return {
      remitente: { id: 'dev-usuario-1', nombre: 'Usuario Uno', usuario: 'usuario.uno' },
      fechaCreacion: new Date().toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
      titulo: 'Asunto',
      descripcion: 'Contenido',
      archivoIds: [],
      ...datos,
    };
  }

  // Configura el módulo de test e inyecta los servicios SIN instanciar
  // todavía el componente — su constructor dispara la carga inicial de
  // mensajes de inmediato, así que los spies deben existir antes de crear
  // el fixture (mismo patrón que BandejaMensajesPage).
  function configurar(rol: UserRole = 'Usuario'): void {
    TestBed.configureTestingModule({
      imports: [InicioPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
    (authService as any).currentUserSignal.set({
      id: 'dev-usuario-2',
      nombre: 'sergio',
      usuario: 'sergio',
      rol,
    });

    mensajesService = TestBed.inject(MensajesService);
  }

  function crearFixture(): void {
    fixture = TestBed.createComponent(InicioPage);
  }

  it('should create', () => {
    configurar();
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
    crearFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('el hero muestra "Inicio" como único h1 de la página', () => {
    configurar();
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
    crearFixture();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Inicio');
  });

  it('el saludo muestra el nombre del CurrentUser', () => {
    configurar();
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
    crearFixture();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Bienvenido, sergio.');
  });

  describe('Accesos rápidos', () => {
    it('Usuario ve Mensaje nuevo, Bandeja de entrada y Formatos con sus rutas reales', () => {
      configurar('Usuario');
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a[href="/mensajes/redactar"]')?.textContent).toContain(
        'Mensaje nuevo',
      );
      expect(compiled.querySelector('a[href="/mensajes/recibidos"]')?.textContent).toContain(
        'Bandeja de entrada',
      );
      expect(compiled.querySelector('a[href="/formatos"]')?.textContent).toContain('Formatos');
    });

    it('Usuario NO ve el acceso a Administración', () => {
      configurar('Usuario');
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a[href="/administracion/usuarios"]')).toBeNull();
      expect(compiled.textContent).not.toContain('Administración');
    });

    it('Administrador sí ve el acceso a Administración con su ruta real', () => {
      configurar('Administrador');
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a[href="/administracion/usuarios"]')?.textContent).toContain(
        'Administración',
      );
    });
  });

  describe('Mensajes recientes', () => {
    it('llama a MensajesService.recibidos()', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      expect(mensajesService.recibidos).toHaveBeenCalled();
    });

    it('muestra "Cargando mensajes…" solo en la sección de mensajes mientras accesos y enlaces siguen visibles', () => {
      configurar();
      // Subject que nunca emite: permite inspeccionar el estado de carga
      // antes de que la suscripción se resuelva.
      const emisor = new Subject<MensajeRecibido[]>();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(emisor.asObservable());
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cargando mensajes…');
      expect(compiled.querySelectorAll('.acceso-card').length).toBeGreaterThan(0);
      expect(compiled.querySelectorAll('.inicio__fila-enlace').length).toBe(5);
    });

    it('muestra un error accesible si la carga falla, sin ocultar accesos ni enlaces', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(throwError(() => new Error('falla')));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const alerta = compiled.querySelector('[role="alert"]');
      expect(alerta?.textContent).toContain('No fue posible cargar los mensajes recientes.');
      expect(compiled.querySelectorAll('.acceso-card').length).toBeGreaterThan(0);
      expect(compiled.querySelectorAll('.inicio__fila-enlace').length).toBe(5);
    });

    it('muestra el estado vacío cuando no hay mensajes recibidos', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No tienes mensajes recientes.');
    });

    it('ordena por fechaCreacion descendente antes de tomar los recientes', () => {
      configurar();
      const antiguo = mensaje({ id: 'antiguo', fechaCreacion: new Date(2026, 0, 1).toISOString() });
      const reciente = mensaje({ id: 'reciente', fechaCreacion: new Date(2026, 0, 10).toISOString() });
      const intermedio = mensaje({
        id: 'intermedio',
        fechaCreacion: new Date(2026, 0, 5).toISOString(),
      });
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([antiguo, reciente, intermedio]));
      crearFixture();
      fixture.detectChanges();

      const ids = fixture.componentInstance['mensajesRecientes']().map((m) => m.id);
      expect(ids).toEqual(['reciente', 'intermedio', 'antiguo']);
    });

    it('muestra como máximo 5 mensajes aunque lleguen más', () => {
      configurar();
      const mensajes = Array.from({ length: 7 }, (_, i) =>
        mensaje({ id: `mensaje-${i}`, fechaCreacion: new Date(2026, 0, i + 1).toISOString() }),
      );
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of(mensajes));
      crearFixture();
      fixture.detectChanges();

      expect(fixture.componentInstance['mensajesRecientes']().length).toBe(5);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.inicio__fila-mensaje').length).toBe(5);
    });

    it('muestra título, remitente y fecha de cada mensaje', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(
        of([mensaje({ id: 'mensaje-1', titulo: 'Circular institucional' })]),
      );
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Circular institucional');
      expect(compiled.textContent).toContain('Usuario Uno');
    });

    it('distingue visualmente y por texto los mensajes en estado Nuevo', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(
        of([mensaje({ id: 'mensaje-1', estadoLectura: 'Nuevo' })]),
      );
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.inicio__fila-mensaje--nuevo')).not.toBeNull();
      expect(compiled.querySelector('.inicio__fila-mensaje--nuevo')?.textContent).toContain('Nuevo');
    });

    it('un mensaje Visto muestra el badge correspondiente', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(
        of([mensaje({ id: 'mensaje-1', estadoLectura: 'Visto' })]),
      );
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.inicio__fila-mensaje--nuevo')).toBeNull();
      expect(compiled.querySelector('.inicio__fila-mensaje')?.textContent).toContain('Visto');
    });

    it('un mensaje Eliminado no intenta mostrar título/descripción inexistentes', () => {
      configurar();
      const eliminado: MensajeRecibido = {
        id: 'mensaje-3',
        remitente: { id: 'dev-usuario-1', nombre: 'Usuario Uno', usuario: 'usuario.uno' },
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

    it('cada mensaje enlaza a la ruta real de detalle /mensajes/:id', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([mensaje({ id: 'mensaje-42' })]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a[href="/mensajes/mensaje-42"]')).not.toBeNull();
    });

    it('incluye la acción "Ver bandeja de entrada" hacia /mensajes/recibidos', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const enlace = compiled.querySelector('.inicio__ver-bandeja');
      expect(enlace?.getAttribute('href')).toBe('/mensajes/recibidos');
      expect(enlace?.textContent).toContain('Ver bandeja de entrada');
    });
  });

  describe('Enlaces institucionales', () => {
    it('muestra exactamente 5 enlaces, con nombres y orden exactos', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const nombres = Array.from(compiled.querySelectorAll('.inicio__fila-enlace-nombre')).map(
        (el) => el.textContent?.trim(),
      );
      expect(nombres).toEqual([
        'Cámara de Diputados del Estado de México',
        'Instituto de Estudios Legislativos',
        'Órgano Superior de Fiscalización',
        'Secretaría de Asuntos Parlamentarios',
        'Contraloría del Poder Legislativo',
      ]);
    });

    it('no renderiza ningún <a> mientras las URL sigan pendientes, y muestra el estado "Pendiente"', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a.inicio__fila-enlace')).toBeNull();
      expect(compiled.querySelectorAll('.inicio__fila-enlace--pendiente').length).toBe(5);
      expect(compiled.textContent).toContain('Pendiente');
    });

    it('el catálogo admite una URL futura sin cambiar la estructura: renderiza <a> con target/rel seguros', () => {
      configurar();
      vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([]));
      crearFixture();
      (fixture.componentInstance as any).enlaces = [
        { nombre: 'Enlace con URL', url: 'https://ejemplo.gob.mx' },
      ];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const enlace = compiled.querySelector('a.inicio__fila-enlace');
      expect(enlace).not.toBeNull();
      expect(enlace?.getAttribute('href')).toBe('https://ejemplo.gob.mx');
      expect(enlace?.getAttribute('target')).toBe('_blank');
      expect(enlace?.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
