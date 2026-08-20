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

  it('el hero muestra "Mensaje nuevo" en modo normal', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Mensaje nuevo');
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

describe('RedactarMensajePage — selector de destinatarios con búsqueda', () => {
  let component: RedactarMensajePage;
  let fixture: ComponentFixture<RedactarMensajePage>;
  let usuariosService: UsuariosService;
  let mensajesService: MensajesService;
  let archivosService: ArchivosService;
  let router: Router;

  const usuariosBusqueda: Usuario[] = [
    {
      id: 'u-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Usuario',
      estado: 'Activo',
    },
    {
      id: 'u-2',
      nombre: 'Usuario de Prueba Dos',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
      estado: 'Activo',
    },
    { id: 'u-3', nombre: 'Otra Persona', usuario: 'otra.persona', rol: 'Usuario', estado: 'Activo' },
  ];

  function eventoBusqueda(valor: string): Event {
    return { target: { value: valor } } as unknown as Event;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RedactarMensajePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    usuariosService = TestBed.inject(UsuariosService);
    mensajesService = TestBed.inject(MensajesService);
    archivosService = TestBed.inject(ArchivosService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosBusqueda));

    fixture = TestBed.createComponent(RedactarMensajePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sin término de búsqueda, muestra todos los usuarios cargados', () => {
    expect(component['usuariosFiltrados']()).toEqual(usuariosBusqueda);
  });

  it('filtra por nombre con coincidencia parcial', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('Prueba Uno'));

    expect(component['usuariosFiltrados']()).toEqual([usuariosBusqueda[0]]);
  });

  it('filtra por usuario con coincidencia parcial', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('usuario.prueba'));

    expect(component['usuariosFiltrados']()).toEqual([usuariosBusqueda[0], usuariosBusqueda[1]]);
  });

  it('la búsqueda es case-insensitive e ignora espacios accidentales al inicio/final', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('  PRUEBA UNO  '));

    expect(component['usuariosFiltrados']()).toEqual([usuariosBusqueda[0]]);
  });

  it('sin coincidencias, la lista filtrada queda vacía y el template lo indica', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('zzz-inexistente'));
    fixture.detectChanges();

    expect(component['usuariosFiltrados']()).toEqual([]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se encontraron destinatarios.');
  });

  it('aún sin destinatarios seleccionados, el template lo indica', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aún no has seleccionado destinatarios.');
  });

  it('agregarDestinatario selecciona un usuario', () => {
    component['agregarDestinatario']('u-1');

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-1']);
    expect(component['estaSeleccionado']('u-1')).toBe(true);
  });

  it('agregarDestinatario no duplica un usuario ya seleccionado', () => {
    component['agregarDestinatario']('u-1');
    component['agregarDestinatario']('u-1');

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-1']);
  });

  it('quitarDestinatario retira únicamente ese usuario', () => {
    component['agregarDestinatario']('u-1');
    component['agregarDestinatario']('u-2');

    component['quitarDestinatario']('u-1');

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-2']);
  });

  describe('MICROCORRECCIÓN 15C.2 — sin duplicación visual entre disponibles y seleccionados', () => {
    it('al seleccionar un usuario, desaparece de la lista de disponibles', () => {
      expect(component['usuariosDisponibles']()).toEqual(usuariosBusqueda);

      component['agregarDestinatario']('u-1');

      expect(component['usuariosDisponibles']()).toEqual([usuariosBusqueda[1], usuariosBusqueda[2]]);
    });

    it('al quitar un seleccionado, vuelve a disponibles si coincide con el filtro actual', () => {
      component['agregarDestinatario']('u-1');
      component['onBuscarDestinatarios'](eventoBusqueda('prueba uno'));
      expect(component['usuariosDisponibles']()).toEqual([]);

      component['quitarDestinatario']('u-1');

      expect(component['usuariosDisponibles']()).toEqual([usuariosBusqueda[0]]);
    });

    it('al quitar un seleccionado que ya no coincide con el filtro actual, no vuelve a aparecer en disponibles', () => {
      component['agregarDestinatario']('u-1');
      component['onBuscarDestinatarios'](eventoBusqueda('otra persona'));

      component['quitarDestinatario']('u-1');

      expect(component['usuariosDisponibles']()).toEqual([usuariosBusqueda[2]]);
    });

    it('seleccionar todos deja la lista de disponibles vacía', () => {
      component['seleccionarResultadosFiltrados']();

      expect(component['usuariosDisponibles']()).toEqual([]);
    });

    it('cuando todos los resultados filtrados ya están seleccionados, el template muestra el estado correspondiente', () => {
      component['seleccionarResultadosFiltrados']();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Todos los destinatarios visibles están seleccionados.');
      expect(compiled.textContent).not.toContain('No se encontraron destinatarios.');
    });

    it('una búsqueda realmente sin coincidencias sigue mostrando su propio estado, distinto del anterior', () => {
      component['agregarDestinatario']('u-1');
      component['onBuscarDestinatarios'](eventoBusqueda('zzz-inexistente'));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No se encontraron destinatarios.');
      expect(compiled.textContent).not.toContain('Todos los destinatarios visibles están seleccionados.');
    });

    it('un usuario ya seleccionado no aparece dos veces en el DOM (disponibles + seleccionados)', () => {
      component['agregarDestinatario']('u-1');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const apariciones = compiled.querySelectorAll('.redactar-mensaje-page__resultado, .redactar-mensaje-page__seleccionado');
      const nombres = Array.from(apariciones)
        .map((el) => el.textContent ?? '')
        .filter((texto) => texto.includes('Usuario de Prueba Uno'));

      expect(nombres.length).toBe(1);
    });
  });

  it('destinatariosSeleccionados() refleja los usuarios agregados y el contador se actualiza', () => {
    expect(component['totalDestinatariosSeleccionados']()).toBe(0);

    component['agregarDestinatario']('u-1');
    component['agregarDestinatario']('u-2');

    expect(component['totalDestinatariosSeleccionados']()).toBe(2);
    expect(component['destinatariosSeleccionados']()).toEqual([usuariosBusqueda[0], usuariosBusqueda[1]]);
  });

  it('seleccionarResultadosFiltrados agrega todos los usuarios cuando no hay término de búsqueda', () => {
    component['seleccionarResultadosFiltrados']();

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-1', 'u-2', 'u-3']);
  });

  it('seleccionarResultadosFiltrados agrega solo los que coinciden con el filtro actual', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('prueba'));

    component['seleccionarResultadosFiltrados']();

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-1', 'u-2']);
  });

  it('seleccionarResultadosFiltrados no duplica a quien ya estaba seleccionado', () => {
    component['agregarDestinatario']('u-1');

    component['seleccionarResultadosFiltrados']();

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-1', 'u-2', 'u-3']);
  });

  it('limpiarSeleccion retira a todos los destinatarios seleccionados', () => {
    component['seleccionarResultadosFiltrados']();

    component['limpiarSeleccion']();

    expect(component['form'].controls.destinatarioIds.value).toEqual([]);
    expect(component['totalDestinatariosSeleccionados']()).toBe(0);
  });

  it('el envío mediante el nuevo selector conserva exactamente los destinatarios seleccionados', async () => {
    component['form'].controls.titulo.setValue('Asunto');
    component['form'].controls.descripcion.setValue('Contenido');
    component['agregarDestinatario']('u-1');
    component['agregarDestinatario']('u-3');
    vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(mensajesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ destinatarioIds: ['u-1', 'u-3'] }),
    );
  });

  describe('adjuntos — contador y resumen', () => {
    function archivoRespuesta(id: string, nombre: string): Archivo {
      return { id, nombreOriginal: nombre, mimeType: 'application/pdf', tamano: 10, fechaSubida: '' };
    }

    function eventoConArchivos(files: File[]): Event {
      return { target: { files, value: '' } } as unknown as Event;
    }

    it('sin archivos seleccionados, el contador no se muestra y el resumen indica 0', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Ningún archivo seleccionado.');
      expect(component['resumenEnvio']()).toBe('0 destinatarios · 0 archivos adjuntos');
    });

    it('muestra el nombre y el tamaño legible de cada archivo seleccionado', () => {
      const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('documento.pdf');
      expect(compiled.textContent).toContain(component['tamanoLegible'](archivo.size));
    });

    it('el contador de archivos usa singular/plural correctamente', () => {
      const archivo1 = new File(['a'], 'uno.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo1]));
      expect(component['textoContadorArchivos']()).toBe('1 archivo seleccionado');

      const archivo2 = new File(['b'], 'dos.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo2]));
      expect(component['textoContadorArchivos']()).toBe('2 archivos seleccionados');
    });

    it('quitar un archivo lo elimina de la colección que se enviará', () => {
      const archivo1 = new File(['a'], 'uno.pdf', { type: 'application/pdf' });
      const archivo2 = new File(['b'], 'dos.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo1, archivo2]));

      component['quitarArchivo'](0);

      expect(component['seleccionArchivos']().map((item) => item.file.name)).toEqual(['dos.pdf']);
    });

    it('el resumen combina destinatarios y adjuntos con plurales correctos', () => {
      component['agregarDestinatario']('u-1');
      const archivo = new File(['a'], 'uno.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

      expect(component['resumenEnvio']()).toBe('1 destinatario · 1 archivo adjunto');
    });

    it('el payload final envía exactamente los archivoIds de lo seleccionado tras subir', async () => {
      component['form'].controls.titulo.setValue('Asunto');
      component['form'].controls.descripcion.setValue('Contenido');
      component['agregarDestinatario']('u-1');

      const archivo1 = new File(['a'], 'uno.pdf', { type: 'application/pdf' });
      const archivo2 = new File(['b'], 'dos.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo1, archivo2]));

      vi.spyOn(archivosService, 'subir').mockImplementation((file) =>
        of(archivoRespuesta(`id-${file.name}`, file.name)),
      );
      vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

      await component['onSubmit']();

      expect(mensajesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({ archivoIds: ['id-uno.pdf', 'id-dos.pdf'] }),
      );
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

  it('el hero muestra "Responder mensaje" en modo respuesta', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Responder mensaje');
  });

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

  describe('selector de destinatarios con búsqueda en modo respuesta', () => {
    it('el remitente original queda preseleccionado también para el nuevo selector', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      expect(component['destinatariosSeleccionados']().map((u) => u.id)).toEqual(['dev-usuario-1']);
      expect(component['totalDestinatariosSeleccionados']()).toBe(1);
    });

    it('el remitente original no aparece en la lista de disponibles, ya preseleccionado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      expect(component['usuariosDisponibles']().map((u) => u.id)).toEqual(['dev-usuario-2']);
    });

    it('agregarDestinatario suma otros destinatarios sin perder ni duplicar al remitente original', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      component['agregarDestinatario']('dev-usuario-2');

      expect(component['form'].controls.destinatarioIds.value).toEqual([
        'dev-usuario-1',
        'dev-usuario-2',
      ]);
    });

    it('quitarDestinatario no puede retirar al remitente original', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      component['quitarDestinatario']('dev-usuario-1');

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
    });

    it('limpiarSeleccion conserva al remitente original en vez de vaciar todo', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      component['agregarDestinatario']('dev-usuario-2');
      component['limpiarSeleccion']();

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-1']);
    });

    it('seleccionarResultadosFiltrados no duplica al remitente original ya preseleccionado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      component['seleccionarResultadosFiltrados']();

      expect(component['form'].controls.destinatarioIds.value).toEqual([
        'dev-usuario-1',
        'dev-usuario-2',
      ]);
    });

    it('el envío en modo respuesta mediante el nuevo selector conserva respuestaAId y destinatarios', async () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(originalValido));
      crearFixture();
      fixture.detectChanges();

      component['form'].controls.titulo.setValue('Asunto');
      component['form'].controls.descripcion.setValue('Contenido');
      component['agregarDestinatario']('dev-usuario-2');
      vi.spyOn(mensajesService, 'crear').mockReturnValue(of({} as any));

      await component['onSubmit']();

      expect(mensajesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          respuestaAId: 'mensaje-original',
          destinatarioIds: ['dev-usuario-1', 'dev-usuario-2'],
        }),
      );
    });
  });
});
