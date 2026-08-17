import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EditarMensajePage } from './editar-mensaje-page';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { ArchivosService } from '../../../archivos/services/archivos.service';
import { MensajesService } from '../../services/mensajes.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { Archivo } from '../../../archivos/models/archivo.model';
import { MensajeEnviado, MensajeRecibido } from '../../models/mensaje.model';

describe('EditarMensajePage', () => {
  let component: EditarMensajePage;
  let fixture: ComponentFixture<EditarMensajePage>;
  let usuariosService: UsuariosService;
  let archivosService: ArchivosService;
  let mensajesService: MensajesService;
  let router: Router;

  const usuarios: Usuario[] = [
    { id: 'dev-usuario-1', nombre: 'Uno', usuario: 'uno', rol: 'Administrador', estado: 'Activo' },
    { id: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', rol: 'Usuario', estado: 'Activo' },
  ];

  const enviadoEditable: MensajeEnviado = {
    id: 'mensaje-1',
    fechaCreacion: new Date().toISOString(),
    estado: 'Enviado',
    contenidoDisponible: true,
    destinatarios: [
      { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
    ],
    titulo: 'Asunto original',
    descripcion: 'Contenido original',
    archivoIds: ['archivo-1', 'archivo-2'],
  };

  function archivoRespuesta(id: string, nombre: string): Archivo {
    return { id, nombreOriginal: nombre, mimeType: 'application/pdf', tamano: 10, fechaSubida: '' };
  }

  function eventoConArchivos(files: File[]): Event {
    return { target: { files, value: '' } } as unknown as Event;
  }

  function eventoCheckbox(checked: boolean): Event {
    return { target: { checked } } as unknown as Event;
  }

  // La carga del detalle se dispara desde el constructor, así que los spies
  // sobre MensajesService deben existir antes de crear el fixture.
  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [EditarMensajePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'mensaje-1' }) } },
        },
      ],
    });

    usuariosService = TestBed.inject(UsuariosService);
    archivosService = TestBed.inject(ArchivosService);
    mensajesService = TestBed.inject(MensajesService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuarios));
  }

  function crearFixture(): void {
    fixture = TestBed.createComponent(EditarMensajePage);
    component = fixture.componentInstance;
  }

  it('carga un MensajeEnviado editable y precarga título, descripción y destinatarios', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();

    fixture.detectChanges();

    expect(mensajesService.obtenerDetalle).toHaveBeenCalledWith('mensaje-1');
    expect(component['editable']()).toBe(true);
    expect(component['form'].controls.titulo.value).toBe('Asunto original');
    expect(component['form'].controls.descripcion.value).toBe('Contenido original');
    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-2']);
  });

  it('lista los adjuntos existentes por índice', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const textos = Array.from(compiled.querySelectorAll('li')).map((li) => li.textContent);
    expect(textos.some((t) => t?.includes('Adjunto existente 1'))).toBe(true);
    expect(textos.some((t) => t?.includes('Adjunto existente 2'))).toBe(true);
  });

  it('retirar un adjunto existente lo quita de archivoIdsExistentes', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    component['quitarArchivoExistente']('archivo-1');

    expect(component['archivoIdsExistentes']()).toEqual(['archivo-2']);
  });

  it('permite seleccionar y deseleccionar destinatarios', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-2', 'dev-usuario-1']);

    component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(false));
    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
  });

  it('sin destinatarios seleccionados, el formulario no envía', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(false));
    vi.spyOn(mensajesService, 'actualizar');

    await component['onSubmit']();

    expect(mensajesService.actualizar).not.toHaveBeenCalled();
    expect(component['form'].controls.destinatarioIds.touched).toBe(true);
  });

  it('un archivo nuevo seleccionado se sube al guardar', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    const archivo = new File(['contenido'], 'nuevo.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    vi.spyOn(archivosService, 'subir').mockReturnValue(of(archivoRespuesta('archivo-3', 'nuevo.pdf')));
    vi.spyOn(mensajesService, 'actualizar').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(archivosService.subir).toHaveBeenCalledWith(archivo);
  });

  it('el PATCH usa los ids existentes conservados más los nuevos subidos', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    component['quitarArchivoExistente']('archivo-1');

    const archivo = new File(['contenido'], 'nuevo.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    vi.spyOn(archivosService, 'subir').mockReturnValue(of(archivoRespuesta('archivo-3', 'nuevo.pdf')));
    vi.spyOn(mensajesService, 'actualizar').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(mensajesService.actualizar).toHaveBeenCalledWith('mensaje-1', {
      titulo: 'Asunto original',
      descripcion: 'Contenido original',
      destinatarioIds: ['dev-usuario-2'],
      archivoIds: ['archivo-2', 'archivo-3'],
    });
  });

  it('el PATCH exitoso navega al detalle del mensaje', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    vi.spyOn(mensajesService, 'actualizar').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/mensajes/mensaje-1');
  });

  it('un PATCH fallido conserva los archivos nuevos ya subidos y el reintento no los reenvía', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    const archivo = new File(['contenido'], 'nuevo.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    const spySubir = vi
      .spyOn(archivosService, 'subir')
      .mockReturnValue(of(archivoRespuesta('archivo-3', 'nuevo.pdf')));

    vi.spyOn(mensajesService, 'actualizar').mockReturnValueOnce(throwError(() => new Error('falla')));
    await component['onSubmit']();

    expect(component['errorGuardar']()).toBe('No fue posible guardar los cambios. Puedes intentarlo de nuevo.');
    expect(component['seleccionArchivos']()[0].archivoSubido?.id).toBe('archivo-3');
    expect(spySubir).toHaveBeenCalledTimes(1);

    vi.spyOn(mensajesService, 'actualizar').mockReturnValue(of({} as any));
    await component['onSubmit']();

    expect(spySubir).toHaveBeenCalledTimes(1);
  });

  it('un mensaje con algún destinatario Visto no permite edición', () => {
    configurar();
    const conVisto: MensajeEnviado = {
      ...enviadoEditable,
      destinatarios: [
        { usuarioId: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', estadoLectura: 'Visto', estadoRespuesta: 'Pendiente' },
      ],
    };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(conVisto));
    crearFixture();

    fixture.detectChanges();

    expect(component['editable']()).toBe(false);
    expect(component['error']()).toBe('Este mensaje ya no puede editarse.');
  });

  it('un mensaje Cancelado no permite edición', () => {
    configurar();
    const cancelado: MensajeEnviado = { ...enviadoEditable, estado: 'Cancelado' };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(cancelado));
    crearFixture();

    fixture.detectChanges();

    expect(component['editable']()).toBe(false);
    expect(component['error']()).toBe('Este mensaje ya no puede editarse.');
  });

  it('un MensajeRecibido no permite edición', () => {
    configurar();
    const recibido: MensajeRecibido = {
      id: 'mensaje-1',
      remitente: { id: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos' },
      fechaCreacion: new Date().toISOString(),
      estado: 'Enviado',
      contenidoDisponible: true,
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
      titulo: 'Asunto',
      descripcion: 'Contenido',
      archivoIds: [],
    };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(recibido));
    crearFixture();

    fixture.detectChanges();

    expect(component['editable']()).toBe(false);
    expect(component['error']()).toBe('Este mensaje no puede editarse.');
  });

  describe('congelamiento durante guardando()', () => {
    it('con guardando=true, quitarArchivoNuevo no modifica la selección', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      const archivo = new File(['contenido'], 'nuevo.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo]));
      component['guardando'].set(true);

      component['quitarArchivoNuevo'](0);

      expect(component['seleccionArchivos']().length).toBe(1);
    });

    it('con guardando=true, quitarArchivoExistente no modifica los ids existentes', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      component['guardando'].set(true);

      component['quitarArchivoExistente']('archivo-1');

      expect(component['archivoIdsExistentes']()).toEqual(['archivo-1', 'archivo-2']);
    });

    it('con guardando=true, los destinatarios no cambian', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      component['guardando'].set(true);

      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
      component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(false));

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-2']);
    });
  });
});
