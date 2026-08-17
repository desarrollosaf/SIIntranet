import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RedactarMensajePage } from './redactar-mensaje-page';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { ArchivosService } from '../../../archivos/services/archivos.service';
import { MensajesService } from '../../services/mensajes.service';
import { Usuario } from '../../../usuarios/models/usuario.model';
import { Archivo } from '../../../archivos/models/archivo.model';
import { MensajeRecibido } from '../../models/mensaje.model';

describe('RedactarMensajePage', () => {
  let component: RedactarMensajePage;
  let fixture: ComponentFixture<RedactarMensajePage>;
  let usuariosService: UsuariosService;
  let archivosService: ArchivosService;
  let mensajesService: MensajesService;
  let router: Router;

  const usuarios: Usuario[] = [
    { id: 'dev-usuario-1', nombre: 'Uno', usuario: 'uno', rol: 'Administrador', estado: 'Activo' },
    { id: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', rol: 'Usuario', estado: 'Activo' },
  ];

  function archivoRespuesta(id: string, nombre: string): Archivo {
    return { id, nombreOriginal: nombre, mimeType: 'application/pdf', tamano: 10, fechaSubida: '' };
  }

  function eventoConArchivos(files: File[]): Event {
    return { target: { files, value: '' } } as unknown as Event;
  }

  function eventoCheckbox(checked: boolean): Event {
    return { target: { checked } } as unknown as Event;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RedactarMensajePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    usuariosService = TestBed.inject(UsuariosService);
    archivosService = TestBed.inject(ArchivosService);
    mensajesService = TestBed.inject(MensajesService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');

    vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuarios));

    fixture = TestBed.createComponent(RedactarMensajePage);
    component = fixture.componentInstance;
  });

  it('carga el listado de usuarios al iniciar', () => {
    fixture.detectChanges();

    expect(usuariosService.listar).toHaveBeenCalled();
    expect(component['usuarios']()).toEqual(usuarios);
  });

  describe('selección de destinatarios mediante checkboxes', () => {
    it('marcar un checkbox añade el id del usuario', () => {
      fixture.detectChanges();

      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
      expect(component['estaSeleccionado']('dev-usuario-1')).toBe(true);
    });

    it('marcar un segundo checkbox conserva ambos ids', () => {
      fixture.detectChanges();

      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
      component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(true));

      expect(component['form'].controls.destinatarioIds.value).toEqual([
        'dev-usuario-1',
        'dev-usuario-2',
      ]);
    });

    it('desmarcar un checkbox retira únicamente ese id', () => {
      fixture.detectChanges();

      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
      component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(true));
      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(false));

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-2']);
      expect(component['estaSeleccionado']('dev-usuario-1')).toBe(false);
    });

    it('marcar el mismo checkbox dos veces no produce ids duplicados', () => {
      fixture.detectChanges();

      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
    });

    it('sin destinatarios seleccionados, el formulario no envía', async () => {
      fixture.detectChanges();
      component['form'].controls.titulo.setValue('Asunto');
      component['form'].controls.descripcion.setValue('Contenido');
      vi.spyOn(mensajesService, 'crear');

      await component['onSubmit']();

      expect(mensajesService.crear).not.toHaveBeenCalled();
      expect(component['form'].controls.destinatarioIds.touched).toBe(true);
    });

    it('el flujo de envío conserva los destinatarioIds seleccionados mediante checkboxes', async () => {
      fixture.detectChanges();
      component['form'].controls.titulo.setValue('Asunto');
      component['form'].controls.descripcion.setValue('Contenido');
      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
      component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(true));
      vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

      await component['onSubmit']();

      expect(mensajesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({ destinatarioIds: ['dev-usuario-1', 'dev-usuario-2'] }),
      );
    });
  });

  it('un formulario inválido no envía el mensaje', async () => {
    fixture.detectChanges();
    vi.spyOn(mensajesService, 'crear');

    await component['onSubmit']();

    expect(mensajesService.crear).not.toHaveBeenCalled();
  });

  it('sin adjuntos, crea el mensaje directamente con archivoIds vacío', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });
    vi.spyOn(archivosService, 'subir');
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(archivosService.subir).not.toHaveBeenCalled();
    expect(mensajesService.crear).toHaveBeenCalledWith({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
      archivoIds: [],
    });
  });

  it('con adjuntos, los sube primero y usa los ids resultantes en el mensaje', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });

    const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    vi.spyOn(archivosService, 'subir').mockReturnValue(of(archivoRespuesta('archivo-1', 'documento.pdf')));
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(archivosService.subir).toHaveBeenCalledWith(archivo);
    expect(mensajesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ archivoIds: ['archivo-1'] }),
    );
  });

  it('sube varios adjuntos y los incluye todos', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });

    const archivo1 = new File(['uno'], 'uno.pdf', { type: 'application/pdf' });
    const archivo2 = new File(['dos'], 'dos.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo1, archivo2]));

    vi.spyOn(archivosService, 'subir').mockImplementation((file) =>
      of(archivoRespuesta(`id-${file.name}`, file.name)),
    );
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(archivosService.subir).toHaveBeenCalledTimes(2);
    expect(mensajesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ archivoIds: ['id-uno.pdf', 'id-dos.pdf'] }),
    );
  });

  it('un error al subir un adjunto no ejecuta POST /mensajes', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });

    const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    vi.spyOn(archivosService, 'subir').mockReturnValue(throwError(() => new Error('falla')));
    vi.spyOn(mensajesService, 'crear');

    await component['onSubmit']();

    expect(mensajesService.crear).not.toHaveBeenCalled();
    expect(component['error']()).toBe('No fue posible subir uno de los archivos seleccionados.');
  });

  it('un error al crear el mensaje conserva los archivos ya subidos', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });

    const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    vi.spyOn(archivosService, 'subir').mockReturnValue(of(archivoRespuesta('archivo-1', 'documento.pdf')));
    vi.spyOn(mensajesService, 'crear').mockReturnValue(throwError(() => new Error('falla')));

    await component['onSubmit']();

    expect(component['error']()).toBe('No fue posible enviar el mensaje. Puedes intentarlo de nuevo.');
    expect(component['seleccionArchivos']()[0].archivoSubido).toEqual(
      archivoRespuesta('archivo-1', 'documento.pdf'),
    );
  });

  it('un reintento no vuelve a subir un archivo ya preparado', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });

    const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    const spySubir = vi
      .spyOn(archivosService, 'subir')
      .mockReturnValue(of(archivoRespuesta('archivo-1', 'documento.pdf')));

    // Primer intento falla al crear el mensaje.
    vi.spyOn(mensajesService, 'crear').mockReturnValueOnce(throwError(() => new Error('falla')));
    await component['onSubmit']();
    expect(spySubir).toHaveBeenCalledTimes(1);

    // Segundo intento: el archivo ya tiene archivoSubido, no debe volver a subirse.
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));
    await component['onSubmit']();

    expect(spySubir).toHaveBeenCalledTimes(1);
  });

  it('el éxito navega a /mensajes/enviados', async () => {
    fixture.detectChanges();
    component['form'].setValue({
      titulo: 'Asunto',
      descripcion: 'Contenido',
      destinatarioIds: ['dev-usuario-2'],
    });
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/mensajes/enviados');
  });

  describe('congelamiento durante enviando()', () => {
    it('con enviando=true, quitarArchivo no modifica seleccionArchivos', () => {
      fixture.detectChanges();
      const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo]));
      component['enviando'].set(true);

      component['quitarArchivo'](0);

      expect(component['seleccionArchivos']().length).toBe(1);
    });

    it('con enviando=true, onDestinatarioToggle no modifica destinatarioIds', () => {
      fixture.detectChanges();
      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(true));
      component['enviando'].set(true);

      component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(false));
      component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(true));

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
    });
  });
});

describe('RedactarMensajePage — modo respuesta', () => {
  let component: RedactarMensajePage;
  let fixture: ComponentFixture<RedactarMensajePage>;
  let usuariosService: UsuariosService;
  let archivosService: ArchivosService;
  let mensajesService: MensajesService;
  let router: Router;

  const usuarios: Usuario[] = [
    { id: 'dev-usuario-1', nombre: 'Uno', usuario: 'uno', rol: 'Administrador', estado: 'Activo' },
    { id: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', rol: 'Usuario', estado: 'Activo' },
  ];

  const originalValido: MensajeRecibido = {
    id: 'mensaje-original',
    remitente: { id: 'dev-usuario-1', nombre: 'Uno', usuario: 'uno' },
    fechaCreacion: new Date().toISOString(),
    estado: 'Enviado',
    contenidoDisponible: true,
    estadoLectura: 'Nuevo',
    estadoRespuesta: 'Pendiente',
    titulo: 'Original',
    descripcion: 'Contenido original',
    archivoIds: [],
  };

  function eventoConArchivos(files: File[]): Event {
    return { target: { files, value: '' } } as unknown as Event;
  }

  function eventoCheckbox(checked: boolean): Event {
    return { target: { checked } } as unknown as Event;
  }

  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [RedactarMensajePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'mensaje-original' }) } },
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
    fixture = TestBed.createComponent(RedactarMensajePage);
    component = fixture.componentInstance;
  }

  it('carga el mensaje original y precarga al remitente como destinatario obligatorio', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();

    fixture.detectChanges();

    expect(mensajesService.obtenerDetalle).toHaveBeenCalledWith('mensaje-original');
    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
    expect(component['esRemitenteOriginal']('dev-usuario-1')).toBe(true);
  });

  it('el título no se precompleta automáticamente', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();

    fixture.detectChanges();

    expect(component['form'].controls.titulo.value).toBe('');
    expect(component['form'].controls.descripcion.value).toBe('');
  });

  it('el remitente original no puede quitarse de destinatarios', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();
    fixture.detectChanges();

    component['onDestinatarioToggle']('dev-usuario-1', eventoCheckbox(false));

    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
  });

  it('otros destinatarios sí pueden marcarse/desmarcarse en modo respuesta', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();
    fixture.detectChanges();

    component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(true));
    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1', 'dev-usuario-2']);

    component['onDestinatarioToggle']('dev-usuario-2', eventoCheckbox(false));
    expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
  });

  it('el envío en modo respuesta incluye respuestaAId', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();
    fixture.detectChanges();

    component['form'].controls.titulo.setValue('Asunto');
    component['form'].controls.descripcion.setValue('Contenido');
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(mensajesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ respuestaAId: 'mensaje-original', destinatarioIds: ['dev-usuario-1'] }),
    );
  });

  it('un error cargando el original bloquea el envío', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();
    fixture.detectChanges();

    component['form'].controls.titulo.setValue('Asunto');
    component['form'].controls.descripcion.setValue('Contenido');
    vi.spyOn(mensajesService, 'crear');

    await component['onSubmit']();

    expect(mensajesService.crear).not.toHaveBeenCalled();
    expect(component['errorOriginal']()).toBeTruthy();
  });

  it('un original Eliminado (contenidoDisponible=false) bloquea la respuesta', async () => {
    configurar();
    const eliminado: MensajeRecibido = {
      id: 'mensaje-original',
      remitente: originalValido.remitente,
      fechaCreacion: originalValido.fechaCreacion,
      estado: 'Eliminado',
      contenidoDisponible: false,
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
    };
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(eliminado));
    crearFixture();
    fixture.detectChanges();

    component['form'].controls.titulo.setValue('Asunto');
    component['form'].controls.descripcion.setValue('Contenido');
    vi.spyOn(mensajesService, 'crear');

    await component['onSubmit']();

    expect(mensajesService.crear).not.toHaveBeenCalled();
    expect(component['errorOriginal']()).toBeTruthy();
  });

  it('un POST fallido en modo respuesta conserva los archivos ya subidos y el reintento no vuelve a subirlos', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();
    fixture.detectChanges();

    component['form'].controls.titulo.setValue('Asunto');
    component['form'].controls.descripcion.setValue('Contenido');

    const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    const spySubir = vi.spyOn(archivosService, 'subir').mockReturnValue(
      of({ id: 'archivo-1', nombreOriginal: 'documento.pdf', mimeType: 'application/pdf', tamano: 10, fechaSubida: '' }),
    );

    vi.spyOn(mensajesService, 'crear').mockReturnValueOnce(throwError(() => new Error('falla')));
    await component['onSubmit']();
    expect(component['seleccionArchivos']()[0].archivoSubido?.id).toBe('archivo-1');
    expect(spySubir).toHaveBeenCalledTimes(1);

    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));
    await component['onSubmit']();

    expect(spySubir).toHaveBeenCalledTimes(1);
  });
});
