import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { UsuariosPage } from './usuarios-page';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';

describe('UsuariosPage', () => {
  let fixture: ComponentFixture<UsuariosPage>;
  let usuariosService: UsuariosService;

  function crearUsuario(overrides: Partial<Usuario> = {}): Usuario {
    return {
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Usuario',
      estado: 'Activo',
      ...overrides,
    };
  }

  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    usuariosService = TestBed.inject(UsuariosService);
  }

  function crearFixture(): void {
    fixture = TestBed.createComponent(UsuariosPage);
  }

  function buscar(termino: string): void {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#buscador-usuarios') as HTMLInputElement;
    input.value = termino;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function filtrarRol(valor: string): void {
    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('#filtro-rol') as HTMLSelectElement;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function filtrarEstado(valor: string): void {
    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('#filtro-estado') as HTMLSelectElement;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function botonesEditar(): HTMLButtonElement[] {
    const compiled = fixture.nativeElement as HTMLElement;
    return Array.from(compiled.querySelectorAll('.usuarios-page__accion')).filter(
      (b) => b.textContent?.trim() === 'Editar',
    ) as HTMLButtonElement[];
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function botonAccionSecundaria(): HTMLButtonElement {
    const compiled = fixture.nativeElement as HTMLElement;
    const botones = Array.from(compiled.querySelectorAll('.usuarios-page__accion')) as HTMLButtonElement[];
    return botones.find((b) => b.textContent?.trim() === 'Activar' || b.textContent?.trim() === 'Desactivar')!;
  }

  // 1. componente creado
  it('crea el componente', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  // 2. único h1
  it('el hero muestra "Administración" como único h1', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Administración');
  });

  // 3. llama una vez a listar()
  it('llama a UsuariosService.listar() exactamente una vez al iniciar', () => {
    configurar();
    const spy = vi.spyOn(usuariosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // 4. loading
  it('muestra un estado de carga mientras la petición está pendiente', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(new Subject<Usuario[]>());
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cargando usuarios');
  });

  // 5. error accesible
  it('muestra un error accesible si la carga falla', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No fue posible cargar el listado de usuarios.');
    expect(compiled.querySelector('[role="alert"]')).toBeTruthy();
  });

  // 6. vacío global
  it('con backend [] muestra "No hay usuarios disponibles." y ningún buscador', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No hay usuarios disponibles.');
    expect(compiled.querySelector('#buscador-usuarios')).toBeNull();
  });

  // 7. render de múltiples usuarios
  it('renderiza una fila por cada usuario recibido', () => {
    configurar();
    const usuarios = [
      crearUsuario({ id: 'u1', nombre: 'Ana Pérez', usuario: 'ana.perez' }),
      crearUsuario({ id: 'u2', nombre: 'Bruno Ruiz', usuario: 'bruno.ruiz' }),
    ];
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuarios));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.usuarios-page__item')).toHaveLength(2);
    expect(compiled.textContent).toContain('Ana Pérez');
    expect(compiled.textContent).toContain('Bruno Ruiz');
  });

  describe('búsqueda y filtros', () => {
    function usuariosDeMuestra(): Usuario[] {
      return [
        crearUsuario({
          id: 'u1',
          nombre: 'Ana Pérez',
          usuario: 'ana.perez',
          rol: 'Administrador',
          estado: 'Activo',
        }),
        crearUsuario({
          id: 'u2',
          nombre: 'Bruno Ruiz',
          usuario: 'bruno.ruiz',
          rol: 'Usuario',
          estado: 'Inactivo',
        }),
        crearUsuario({
          id: 'u3',
          nombre: 'Carla Soto',
          usuario: 'carla.soto',
          rol: 'Usuario',
          estado: 'Activo',
        }),
      ];
    }

    // 8. buscador por nombre
    it('filtra por nombre', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('Bruno');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u2']);
    });

    // 9. buscador por usuario
    it('filtra por nombre de usuario', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('carla.soto');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u3']);
    });

    // 10. case-insensitive
    it('la búsqueda es insensible a mayúsculas/minúsculas', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('ANA');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u1']);
    });

    // 11. trim
    it('ignora espacios al inicio/final del término de búsqueda', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('   ana   ');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u1']);
    });

    // 12. filtro Usuario
    it('filtra por rol Usuario', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      filtrarRol('Usuario');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u2', 'u3']);
    });

    // 13. filtro Administrador
    it('filtra por rol Administrador', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      filtrarRol('Administrador');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u1']);
    });

    // 14. filtro Activo
    it('filtra por estado Activo', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      filtrarEstado('Activo');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u1', 'u3']);
    });

    // 15. filtro Inactivo
    it('filtra por estado Inactivo', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      filtrarEstado('Inactivo');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u2']);
    });

    // 16. combinación búsqueda + rol + estado
    it('combina búsqueda, rol y estado', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('a');
      filtrarRol('Usuario');
      filtrarEstado('Activo');

      const ids = fixture.componentInstance['usuariosFiltrados']().map((u) => u.id);
      expect(ids).toEqual(['u3']);
    });

    // 17. sin coincidencias
    it('muestra un mensaje específico cuando los filtros no producen coincidencias', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuariosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('término que no existe');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No se encontraron usuarios que coincidan con los filtros.');
      expect(fixture.componentInstance['usuariosFiltrados']()).toHaveLength(0);
    });

    // 18. filtrado no muta array original
    it('el filtrado no muta el arreglo original de usuarios', () => {
      configurar();
      const originales = usuariosDeMuestra();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(originales));
      crearFixture();
      fixture.detectChanges();

      buscar('Ana');
      filtrarRol('Administrador');
      filtrarEstado('Activo');
      buscar('');
      filtrarRol('Todos');
      filtrarEstado('Todos');

      expect(fixture.componentInstance['usuarios']()).toEqual(originales);
      expect(fixture.componentInstance['usuarios']()).toHaveLength(3);
    });
  });

  // 19. badges/textos de rol
  it('muestra el rol como texto legible en la fila', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(
      of([crearUsuario({ rol: 'Administrador' })]),
    );
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Administrador');
  });

  // 20. badges/textos de estado
  it('muestra el estado como texto legible en la fila', () => {
    configurar();
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of([crearUsuario({ estado: 'Inactivo' })]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inactivo');
  });

  describe('edición', () => {
    function dosUsuarios(): Usuario[] {
      return [
        crearUsuario({ id: 'u1', nombre: 'Ana Pérez', usuario: 'ana.perez', rol: 'Administrador' }),
        crearUsuario({ id: 'u2', nombre: 'Bruno Ruiz', usuario: 'bruno.ruiz', rol: 'Usuario' }),
      ];
    }

    // 21. Editar abre formulario debajo del usuario correcto
    it('Editar abre el formulario dentro de la fila del usuario correcto', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      botonesEditar()[1].click();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.usuarios-page__item');
      expect(items[0].querySelector('form')).toBeNull();
      expect(items[1].querySelector('form')).toBeTruthy();
    });

    // 22. solo un usuario puede estar editándose
    it('abrir la edición de otro usuario cierra la anterior', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      botonesEditar()[0].click();
      fixture.detectChanges();

      // Tras abrir la edición del primer usuario, su botón "Editar" se
      // oculta (MICROCORRECCIÓN FINAL 15C.5 §4) — el único "Editar" restante
      // en el DOM es el del segundo usuario, ahora en el índice 0.
      botonesEditar()[0].click();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('form')).toHaveLength(1);
      expect(fixture.componentInstance['usuarioEnEdicionId']()).toBe('u2');
    });

    // 23. formulario precargado
    it('el formulario se precarga con nombre, usuario y rol del usuario', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);

      expect(fixture.componentInstance['form'].getRawValue()).toEqual({
        nombre: 'Ana Pérez',
        usuario: 'ana.perez',
        rol: 'Administrador',
      });
    });

    // 24. formulario inválido no guarda
    it('no guarda si el formulario es inválido', () => {
      configurar();
      const spy = vi.spyOn(usuariosService, 'actualizar');
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.componentInstance['form'].patchValue({ nombre: '' });
      fixture.componentInstance['guardarEdicion']();

      expect(spy).not.toHaveBeenCalled();
    });

    // 25. Guardar llama actualizar() con payload correcto
    it('Guardar llama a UsuariosService.actualizar() con el id y los datos del formulario', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      const spy = vi
        .spyOn(usuariosService, 'actualizar')
        .mockReturnValue(of({ ...dosUsuarios()[0], nombre: 'Nuevo nombre' }));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.componentInstance['form'].patchValue({ nombre: 'Nuevo nombre' });
      fixture.componentInstance['guardarEdicion']();

      expect(spy).toHaveBeenCalledWith('u1', {
        nombre: 'Nuevo nombre',
        usuario: 'ana.perez',
        rol: 'Administrador',
      });
    });

    // 26. actualización exitosa actualiza fila
    it('una actualización exitosa refleja los nuevos datos en la fila y cierra la edición', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      vi.spyOn(usuariosService, 'actualizar').mockReturnValue(
        of({ ...dosUsuarios()[0], nombre: 'Nuevo nombre' }),
      );
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.componentInstance['guardarEdicion']();
      fixture.detectChanges();

      expect(fixture.componentInstance['usuarios']()[0].nombre).toBe('Nuevo nombre');
      expect(fixture.componentInstance['usuarioEnEdicionId']()).toBeNull();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nuevo nombre');
    });

    // 27. error al guardar muestra errorEdicion
    it('un error al guardar muestra errorEdicion de forma accesible', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      vi.spyOn(usuariosService, 'actualizar').mockReturnValue(throwError(() => new Error('falla')));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.componentInstance['guardarEdicion']();
      fixture.detectChanges();

      expect(fixture.componentInstance['errorEdicion']()).toBe('No fue posible guardar los cambios.');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form [role="alert"]')?.textContent).toContain(
        'No fue posible guardar los cambios.',
      );
    });

    // 28. Cancelar no realiza petición
    it('Cancelar cierra la edición sin llamar al backend ni modificar datos', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      const spy = vi.spyOn(usuariosService, 'actualizar');
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.componentInstance['form'].patchValue({ nombre: 'Cambio sin guardar' });
      fixture.componentInstance['cancelarEdicion']();
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
      expect(fixture.componentInstance['usuarioEnEdicionId']()).toBeNull();
      expect(fixture.componentInstance['usuarios']()[0].nombre).toBe('Ana Pérez');
    });

    // 34. guardado pendiente impide doble petición
    it('una segunda llamada a guardarEdicion() mientras hay una pendiente no dispara otra petición', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      const spy = vi.spyOn(usuariosService, 'actualizar').mockReturnValue(of(dosUsuarios()[0]));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.componentInstance['guardando'].set(true);
      fixture.componentInstance['guardarEdicion']();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('activar / desactivar', () => {
    function usuarioActivo(): Usuario {
      return crearUsuario({ id: 'u1', nombre: 'Ana Pérez', estado: 'Activo' });
    }

    function usuarioInactivo(): Usuario {
      return crearUsuario({ id: 'u2', nombre: 'Bruno Ruiz', estado: 'Inactivo' });
    }

    // 29 y 30. Desactivar solicita confirmación / cancelar confirmación no llama al servicio
    it('Desactivar solicita confirmación y no llama al servicio si se cancela', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of([usuarioActivo()]));
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const cambiarEstadoSpy = vi.spyOn(usuariosService, 'cambiarEstado');
      crearFixture();
      fixture.detectChanges();

      botonAccionSecundaria().click();
      fixture.detectChanges();

      expect(confirmSpy).toHaveBeenCalled();
      expect(cambiarEstadoSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance['usuarios']()[0].estado).toBe('Activo');
    });

    // 31. confirmar desactivación llama cambiarEstado(..., 'Inactivo')
    it('confirmar la desactivación llama a cambiarEstado con "Inactivo"', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of([usuarioActivo()]));
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const spy = vi
        .spyOn(usuariosService, 'cambiarEstado')
        .mockReturnValue(of({ ...usuarioActivo(), estado: 'Inactivo' }));
      crearFixture();
      fixture.detectChanges();

      botonAccionSecundaria().click();

      expect(spy).toHaveBeenCalledWith('u1', 'Inactivo');
    });

    // 32. Activar llama cambiarEstado(..., 'Activo') sin confirmación
    it('Activar llama a cambiarEstado con "Activo" sin pedir confirmación', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of([usuarioInactivo()]));
      const confirmSpy = vi.spyOn(window, 'confirm');
      const spy = vi
        .spyOn(usuariosService, 'cambiarEstado')
        .mockReturnValue(of({ ...usuarioInactivo(), estado: 'Activo' }));
      crearFixture();
      fixture.detectChanges();

      botonAccionSecundaria().click();

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('u2', 'Activo');
    });

    // 33. error al cambiar estado muestra error
    it('un error al cambiar estado muestra un mensaje accesible', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of([usuarioInactivo()]));
      vi.spyOn(usuariosService, 'cambiarEstado').mockReturnValue(throwError(() => new Error('falla')));
      crearFixture();
      fixture.detectChanges();

      botonAccionSecundaria().click();
      fixture.detectChanges();

      expect(fixture.componentInstance['error']()).toBe('No fue posible actualizar el estado del usuario.');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
        'No fue posible actualizar el estado del usuario.',
      );
    });

    // 35. cambio de estado pendiente impide doble petición
    it('una segunda llamada a alternarEstado() mientras hay una pendiente no dispara otra petición', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of([usuarioInactivo()]));
      const spy = vi.spyOn(usuariosService, 'cambiarEstado').mockReturnValue(new Subject<Usuario>());
      crearFixture();
      fixture.detectChanges();

      const usuario = usuarioInactivo();
      fixture.componentInstance['alternarEstado'](usuario);
      fixture.componentInstance['alternarEstado'](usuario);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('pulido visual — acciones y badges (MICROCORRECCIÓN FINAL 15C.5)', () => {
    function dosUsuarios(): Usuario[] {
      return [
        crearUsuario({
          id: 'u1',
          nombre: 'Ana Pérez',
          usuario: 'ana.perez',
          rol: 'Administrador',
          estado: 'Activo',
        }),
        crearUsuario({
          id: 'u2',
          nombre: 'Bruno Ruiz',
          usuario: 'bruno.ruiz',
          rol: 'Usuario',
          estado: 'Inactivo',
        }),
      ];
    }

    // A. sin separador decorativo "·"
    it('no renderiza ningún separador decorativo "·" entre las acciones', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.usuarios-page__separador')).toBeNull();

      const gruposAcciones = compiled.querySelectorAll('.usuarios-page__acciones');
      gruposAcciones.forEach((grupo) => expect(grupo.textContent).not.toContain('·'));
    });

    // B. usuario NO editándose muestra sus acciones normales
    it('un usuario que no está siendo editado muestra "Editar" y "Activar"/"Desactivar"', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.usuarios-page__item');

      expect(items[0].textContent).toContain('Editar');
      expect(items[0].textContent).toContain('Desactivar');
      expect(items[1].textContent).toContain('Editar');
      expect(items[1].textContent).toContain('Activar');
    });

    // C. usuario editándose oculta Editar/Activar/Desactivar y muestra Guardar/Cancelar
    it('la fila en edición oculta Editar y Activar/Desactivar, y muestra Guardar cambios/Cancelar', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.usuarios-page__item');
      const filaEnEdicion = items[0];

      expect(filaEnEdicion.querySelector('.usuarios-page__acciones')).toBeNull();
      expect(Array.from(filaEnEdicion.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Editar')).toBe(false);
      expect(
        Array.from(filaEnEdicion.querySelectorAll('button')).some(
          (b) => b.textContent?.trim() === 'Activar' || b.textContent?.trim() === 'Desactivar',
        ),
      ).toBe(false);
      expect(filaEnEdicion.textContent).toContain('Guardar cambios');
      expect(filaEnEdicion.textContent).toContain('Cancelar');
    });

    // D. otra fila que no se edita conserva sus acciones normales
    it('una fila distinta a la que se edita conserva sus acciones normales', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.usuarios-page__item');
      const filaSinEditar = items[1];

      expect(filaSinEditar.querySelector('.usuarios-page__acciones')).toBeTruthy();
      expect(filaSinEditar.textContent).toContain('Editar');
      expect(filaSinEditar.textContent).toContain('Activar');
    });

    // Editar/Activar/Desactivar reaparecen al cancelar
    it('cancelar la edición restaura las acciones normales de la fila', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of(dosUsuarios()));
      crearFixture();
      fixture.detectChanges();

      fixture.componentInstance['iniciarEdicion'](dosUsuarios()[0]);
      fixture.detectChanges();
      fixture.componentInstance['cancelarEdicion']();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.usuarios-page__item');
      expect(items[0].querySelector('.usuarios-page__acciones')).toBeTruthy();
      expect(items[0].textContent).toContain('Editar');
    });

    // E. Rol y Estado pertenecen al mismo contenedor visual/estructural
    it('los badges de rol y estado pertenecen al mismo contenedor de badges', () => {
      configurar();
      vi.spyOn(usuariosService, 'listar').mockReturnValue(of([dosUsuarios()[0]]));
      crearFixture();

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const contenedor = compiled.querySelector('.usuarios-page__badges');

      expect(contenedor).toBeTruthy();
      const badges = contenedor!.querySelectorAll('.usuarios-page__badge');
      expect(badges).toHaveLength(2);
      expect(badges[0].textContent?.trim()).toBe('Administrador');
      expect(badges[1].textContent?.trim()).toBe('Activo');
    });
  });
});
