import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { UsuariosPage } from './usuarios-page';
import { UsuariosService } from '../../../usuarios/services/usuarios.service';
import { Usuario } from '../../../usuarios/models/usuario.model';

describe('UsuariosPage', () => {
  let component: UsuariosPage;
  let fixture: ComponentFixture<UsuariosPage>;
  let usuariosService: UsuariosService;

  const usuarios: Usuario[] = [
    { id: 'dev-usuario-1', nombre: 'Uno', usuario: 'uno', rol: 'Administrador', estado: 'Activo' },
    { id: 'dev-usuario-2', nombre: 'Dos', usuario: 'dos', rol: 'Usuario', estado: 'Inactivo' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    usuariosService = TestBed.inject(UsuariosService);
    vi.spyOn(usuariosService, 'listar').mockReturnValue(of(usuarios));

    fixture = TestBed.createComponent(UsuariosPage);
    component = fixture.componentInstance;
  });

  it('carga el listado al iniciar y lo expone', () => {
    fixture.detectChanges();

    expect(usuariosService.listar).toHaveBeenCalled();
    expect(component['usuarios']()).toEqual(usuarios);
    expect(component['cargando']()).toBe(false);
  });

  it('el hero muestra "Administración" sin introducir un h1 duplicado', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Administración');
  });

  it('conserva "Administración de usuarios" como encabezado secundario (h2)', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Administración de usuarios');
  });

  it('muestra un mensaje de error si la carga falla', () => {
    vi.spyOn(usuariosService, 'listar').mockReturnValue(throwError(() => new Error('falla')));

    fixture.detectChanges();

    expect(component['error']()).toBe('No fue posible cargar el listado de usuarios.');
    expect(component['cargando']()).toBe(false);
  });

  it('guardarEdicion() llama a UsuariosService.actualizar() con el id y los datos del formulario', () => {
    fixture.detectChanges();
    vi.spyOn(usuariosService, 'actualizar').mockReturnValue(
      of({ ...usuarios[0], nombre: 'Nuevo nombre' }),
    );

    component['iniciarEdicion'](usuarios[0]);
    component['form'].patchValue({ nombre: 'Nuevo nombre' });
    component['guardarEdicion']();

    expect(usuariosService.actualizar).toHaveBeenCalledWith('dev-usuario-1', {
      nombre: 'Nuevo nombre',
      usuario: 'uno',
      rol: 'Administrador',
    });
    expect(component['usuarios']()[0].nombre).toBe('Nuevo nombre');
    expect(component['usuarioEnEdicionId']()).toBeNull();
  });

  it('alternarEstado() llama a UsuariosService.cambiarEstado() con el estado invertido', () => {
    fixture.detectChanges();
    vi.spyOn(usuariosService, 'cambiarEstado').mockReturnValue(
      of({ ...usuarios[0], estado: 'Inactivo' }),
    );

    component['alternarEstado'](usuarios[0]);

    expect(usuariosService.cambiarEstado).toHaveBeenCalledWith('dev-usuario-1', 'Inactivo');
    expect(component['usuarios']()[0].estado).toBe('Inactivo');
  });
});
