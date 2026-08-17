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

  it('carga enviados cuando route.data.tipo es "enviados"', () => {
    configurar('enviados');
    vi.spyOn(mensajesService, 'enviados').mockReturnValue(of([enviado]));
    crearFixture();

    fixture.detectChanges();

    expect(mensajesService.enviados).toHaveBeenCalled();
    expect(fixture.componentInstance['enviados']()).toEqual([enviado]);
  });

  it('muestra un mensaje de error si la carga falla', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance['error']()).toBe('No fue posible cargar los mensajes.');
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('un mensaje recibido Nuevo se representa con la clase de énfasis', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bandeja-page__item--nuevo')).not.toBeNull();
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

  it('el botón Ver enlaza al detalle del mensaje', () => {
    configurar('recibidos');
    vi.spyOn(mensajesService, 'recibidos').mockReturnValue(of([recibido]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlace = compiled.querySelector('a[href*="mensaje-1"]');
    expect(enlace).not.toBeNull();
  });
});
