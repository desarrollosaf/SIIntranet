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

  // ===== PageHero / navegación (ETAPA 15C.3C) =====

  it('PageHero muestra "Editar mensaje" como único h1', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Editar mensaje');
  });

  it('el enlace "Volver al mensaje" navega al detalle con ?origen=enviados', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlace = compiled.querySelector<HTMLAnchorElement>('a.editar-mensaje-page__volver');
    expect(enlace).not.toBeNull();
    expect(enlace!.getAttribute('href')).toBe('/mensajes/mensaje-1?origen=enviados');
  });

  // ===== Precarga =====

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

  // ===== Carga: errores (no deben destruir el resto del formulario) =====

  it('un error al cargar el detalle muestra un mensaje de error', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    expect(component['error']()).toBe('No fue posible cargar el mensaje.');
    expect(component['cargando']()).toBe(false);
  });

  it('si la carga de usuarios falla, el resto del formulario ya cargado sigue disponible', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    vi.spyOn(usuariosService, 'listar').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    expect(component['errorUsuarios']()).toBe('No fue posible cargar el listado de usuarios.');
    expect(component['editable']()).toBe(true);
    expect(component['form'].controls.titulo.value).toBe('Asunto original');
  });

  // ===== Guardar: flujo funcional =====

  it('sin destinatarios seleccionados, el formulario no envía', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    component['quitarDestinatario']('dev-usuario-2');
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

  it('quitar un archivo nuevo antes de guardar lo excluye de la selección', () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    const archivo1 = new File(['a'], 'uno.pdf', { type: 'application/pdf' });
    const archivo2 = new File(['b'], 'dos.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo1, archivo2]));

    component['quitarArchivoNuevo'](0);

    expect(component['seleccionArchivos']().map((item) => item.file.name)).toEqual(['dos.pdf']);
  });

  it('un error al subir un archivo nuevo bloquea el guardado y no llama a actualizar', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    const archivo = new File(['contenido'], 'nuevo.pdf', { type: 'application/pdf' });
    component['onArchivosSeleccionados'](eventoConArchivos([archivo]));

    vi.spyOn(archivosService, 'subir').mockReturnValue(throwError(() => new Error('falla')));
    vi.spyOn(mensajesService, 'actualizar');

    await component['onSubmit']();

    expect(mensajesService.actualizar).not.toHaveBeenCalled();
    expect(component['errorGuardar']()).toBe('No fue posible subir uno de los archivos seleccionados.');
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

  it('el PATCH exitoso navega al detalle del mensaje conservando ?origen=enviados', async () => {
    configurar();
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
    crearFixture();
    fixture.detectChanges();

    vi.spyOn(mensajesService, 'actualizar').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/mensajes/mensaje-1?origen=enviados');
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

  // ===== Resumen y tamaño legible =====

  describe('resumen', () => {
    it('combina destinatarios y adjuntos (existentes + nuevos) con plurales correctos', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      expect(component['textoResumen']()).toBe('1 destinatario · 2 adjuntos');

      component['quitarArchivoExistente']('archivo-1');
      expect(component['textoResumen']()).toBe('1 destinatario · 1 adjunto');

      const archivo = new File(['a'], 'nuevo.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo]));
      expect(component['textoResumen']()).toBe('1 destinatario · 2 adjuntos');
    });

    it('muestra el nombre y el tamaño legible de cada archivo nuevo seleccionado', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      const archivo = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' });
      component['onArchivosSeleccionados'](eventoConArchivos([archivo]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('documento.pdf');
      expect(compiled.textContent).toContain(component['tamanoLegible'](archivo.size));
    });
  });

  // ===== Reglas de editabilidad (NO relajadas) =====

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

      component['agregarDestinatario']('dev-usuario-1');
      component['quitarDestinatario']('dev-usuario-2');

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-2']);
    });

    it('con guardando=true, seleccionarResultadosFiltrados y limpiarSeleccion no modifican destinatarios', () => {
      configurar();
      vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoEditable));
      crearFixture();
      fixture.detectChanges();

      component['guardando'].set(true);

      component['seleccionarResultadosFiltrados']();
      component['limpiarSeleccion']();

      expect(component['form'].controls.destinatarioIds.value).toEqual(['dev-usuario-2']);
    });
  });
});

describe('EditarMensajePage — selector de destinatarios con búsqueda', () => {
  let component: EditarMensajePage;
  let fixture: ComponentFixture<EditarMensajePage>;
  let usuariosService: UsuariosService;
  let mensajesService: MensajesService;
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

  // El mensaje ya trae a "Otra Persona" como destinatario — permite probar
  // que la precarga también respeta la exclusión disponibles/seleccionados.
  const enviadoPrecargado: MensajeEnviado = {
    id: 'mensaje-1',
    fechaCreacion: new Date().toISOString(),
    estado: 'Enviado',
    contenidoDisponible: true,
    destinatarios: [
      { usuarioId: 'u-3', nombre: 'Otra Persona', usuario: 'otra.persona', estadoLectura: 'Nuevo', estadoRespuesta: 'Pendiente' },
    ],
    titulo: 'Asunto',
    descripcion: 'Contenido',
    archivoIds: [],
  };

  function eventoBusqueda(valor: string): Event {
    return { target: { value: valor } } as unknown as Event;
  }

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
    mensajesService = TestBed.inject(MensajesService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl');
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosBusqueda));
    vi.spyOn(mensajesService, 'obtenerDetalle').mockReturnValue(of(enviadoPrecargado));
  }

  beforeEach(() => {
    configurar();
    fixture = TestBed.createComponent(EditarMensajePage);
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

  it('sin coincidencias, el template indica "No se encontraron destinatarios."', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('zzz-inexistente'));
    fixture.detectChanges();

    expect(component['usuariosFiltrados']()).toEqual([]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se encontraron destinatarios.');
  });

  it('el destinatario precargado no aparece en disponibles', () => {
    expect(component['usuariosDisponibles']().map((u) => u.id)).toEqual(['u-1', 'u-2']);
  });

  it('el destinatario precargado ya aparece en Seleccionados', () => {
    expect(component['destinatariosSeleccionados']().map((u) => u.id)).toEqual(['u-3']);
    expect(component['totalDestinatariosSeleccionados']()).toBe(1);
  });

  it('agregarDestinatario selecciona un usuario y lo quita de disponibles', () => {
    component['agregarDestinatario']('u-1');

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-3', 'u-1']);
    expect(component['usuariosDisponibles']().map((u) => u.id)).toEqual(['u-2']);
  });

  it('agregarDestinatario no duplica un usuario ya seleccionado', () => {
    component['agregarDestinatario']('u-1');
    component['agregarDestinatario']('u-1');

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-3', 'u-1']);
  });

  it('quitarDestinatario retira únicamente ese usuario y lo devuelve a disponibles', () => {
    component['agregarDestinatario']('u-1');

    component['quitarDestinatario']('u-1');

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-3']);
    expect(component['usuariosDisponibles']().map((u) => u.id)).toEqual(['u-1', 'u-2']);
  });

  it('quitar el último destinatario deja el formulario sin destinatarios seleccionados', () => {
    component['quitarDestinatario']('u-3');

    expect(component['form'].controls.destinatarioIds.value).toEqual([]);
    expect(component['totalDestinatariosSeleccionados']()).toBe(0);

    const compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Aún no has seleccionado destinatarios.');
  });

  it('cuando todos los resultados filtrados ya están seleccionados, el template lo indica', () => {
    component['seleccionarResultadosFiltrados']();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Todos los destinatarios visibles están seleccionados.');
    expect(compiled.textContent).not.toContain('No se encontraron destinatarios.');
  });

  it('seleccionarResultadosFiltrados ("Seleccionar todos") agrega todos los disponibles sin filtro', () => {
    component['seleccionarResultadosFiltrados']();

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-3', 'u-1', 'u-2']);
  });

  it('seleccionarResultadosFiltrados ("Seleccionar resultados") agrega solo los que coinciden con el filtro', () => {
    component['onBuscarDestinatarios'](eventoBusqueda('prueba'));

    component['seleccionarResultadosFiltrados']();

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-3', 'u-1', 'u-2']);
  });

  it('el texto de la acción cambia entre "Seleccionar todos" y "Seleccionar resultados" según haya búsqueda', () => {
    expect(component['textoAccionSeleccionarTodos']()).toBe('Seleccionar todos');

    component['onBuscarDestinatarios'](eventoBusqueda('prueba'));

    expect(component['textoAccionSeleccionarTodos']()).toBe('Seleccionar resultados');
  });

  it('seleccionarResultadosFiltrados no duplica a quien ya estaba seleccionado', () => {
    component['seleccionarResultadosFiltrados']();
    component['seleccionarResultadosFiltrados']();

    expect(component['form'].controls.destinatarioIds.value).toEqual(['u-3', 'u-1', 'u-2']);
  });

  it('limpiarSeleccion retira a todos los destinatarios, incluido el precargado', () => {
    component['limpiarSeleccion']();

    expect(component['form'].controls.destinatarioIds.value).toEqual([]);
    expect(component['totalDestinatariosSeleccionados']()).toBe(0);
  });

  it('Limpiar no se muestra cuando no hay selección', () => {
    component['limpiarSeleccion']();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const botones = Array.from(compiled.querySelectorAll('button')).map((b) => b.textContent?.trim());
    expect(botones).not.toContain('Limpiar');
  });

  it('un usuario ya seleccionado no aparece dos veces en el DOM (disponibles + seleccionados)', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const apariciones = compiled.querySelectorAll(
      '.editar-mensaje-page__resultado, .editar-mensaje-page__seleccionado',
    );
    const nombres = Array.from(apariciones)
      .map((el) => el.textContent ?? '')
      .filter((texto) => texto.includes('Otra Persona'));

    expect(nombres.length).toBe(1);
  });

  it('el guardado conserva exactamente los destinatarioIds seleccionados mediante el nuevo selector', async () => {
    component['agregarDestinatario']('u-1');
    vi.spyOn(mensajesService, 'actualizar').mockReturnValue(of({} as any));

    await component['onSubmit']();

    expect(mensajesService.actualizar).toHaveBeenCalledWith(
      'mensaje-1',
      expect.objectContaining({ destinatarioIds: ['u-3', 'u-1'] }),
    );
  });
});
