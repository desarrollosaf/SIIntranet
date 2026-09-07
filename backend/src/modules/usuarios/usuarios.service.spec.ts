import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuariosService],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('listar() devuelve los usuarios de desarrollo iniciales', () => {
    const usuarios = service.listar();

    expect(usuarios.length).toBeGreaterThan(0);
    expect(usuarios.every((u) => u.id.startsWith('dev-usuario-'))).toBe(true);
  });

  it('listar() nunca expone un campo password', () => {
    const usuarios = service.listar();

    for (const usuario of usuarios) {
      expect((usuario as unknown as Record<string, unknown>)['password']).toBeUndefined();
    }
  });

  it('obtenerPorId() devuelve el usuario correspondiente', () => {
    const usuario = service.obtenerPorId('dev-usuario-1');

    expect(usuario.id).toBe('dev-usuario-1');
  });

  it('obtenerPorId() lanza NotFoundException si no existe', () => {
    expect(() => service.obtenerPorId('no-existe')).toThrow(NotFoundException);
  });

  it('actualizar() modifica únicamente los datos permitidos', () => {
    const actualizado = service.actualizar('dev-usuario-2', { nombre: 'Nuevo Nombre' });

    expect(actualizado.nombre).toBe('Nuevo Nombre');
    expect(actualizado.id).toBe('dev-usuario-2');
  });

  it('cambiarEstado() actualiza el estado del usuario', () => {
    const actualizado = service.cambiarEstado('dev-usuario-2', 'Inactivo', 'dev-usuario-1');

    expect(actualizado.estado).toBe('Inactivo');
  });

  it('mutar el resultado de listar()/obtenerPorId() no afecta el almacenamiento interno', () => {
    const listado = service.listar();
    listado[0].nombre = 'Nombre Mutado';
    listado.push({
      id: 'dev-usuario-intruso',
      nombre: 'Intruso',
      usuario: 'intruso',
      rol: 'Usuario',
      estado: 'Activo',
    });

    const usuario = service.obtenerPorId('dev-usuario-1');
    usuario.nombre = 'Otra Mutación';

    expect(service.obtenerPorId('dev-usuario-1').nombre).toBe('Usuario de Prueba Uno');
    expect(service.listar()).toHaveLength(3);
    expect(() => service.obtenerPorId('dev-usuario-intruso')).toThrow(NotFoundException);
  });

  describe('integridad de Administración', () => {
    it('cambiarEstado() rechaza que un Administrador se desactive a sí mismo', () => {
      expect(() => service.cambiarEstado('dev-usuario-1', 'Inactivo', 'dev-usuario-1')).toThrow(
        ConflictException,
      );

      expect(service.obtenerPorId('dev-usuario-1').estado).toBe('Activo');
    });

    it('cambiarEstado() rechaza desactivar al último Administrador activo', () => {
      expect(() => service.cambiarEstado('dev-usuario-1', 'Inactivo', 'dev-usuario-2')).toThrow(
        ConflictException,
      );

      expect(service.obtenerPorId('dev-usuario-1').estado).toBe('Activo');
    });

    it('actualizar() rechaza cambiar el rol del último Administrador activo a Usuario', () => {
      expect(() => service.actualizar('dev-usuario-1', { rol: 'Usuario' })).toThrow(ConflictException);

      expect(service.obtenerPorId('dev-usuario-1').rol).toBe('Administrador');
    });

    it('cambiarEstado() permite que un Administrador desactive a otro si queda al menos uno activo', () => {
      service.actualizar('dev-usuario-2', { rol: 'Administrador' });

      const actualizado = service.cambiarEstado('dev-usuario-2', 'Inactivo', 'dev-usuario-1');

      expect(actualizado.estado).toBe('Inactivo');
    });

    it('actualizar() permite cambiar el rol de otro Administrador a Usuario si queda otro activo', () => {
      service.actualizar('dev-usuario-2', { rol: 'Administrador' });

      const actualizado = service.actualizar('dev-usuario-2', { rol: 'Usuario' });

      expect(actualizado.rol).toBe('Usuario');
    });

    it('cambiarEstado() permite activar/desactivar un Usuario normal sin restricciones', () => {
      const desactivado = service.cambiarEstado('dev-usuario-2', 'Inactivo', 'dev-usuario-1');
      expect(desactivado.estado).toBe('Inactivo');

      const activado = service.cambiarEstado('dev-usuario-2', 'Activo', 'dev-usuario-1');
      expect(activado.estado).toBe('Activo');
    });

    // Repite el caso ya cubierto por 'actualizar() modifica únicamente los
    // datos permitidos' arriba, con el único Administrador, para confirmar
    // que no dispara ninguna de las reglas de integridad.
    it('actualizar() cambia nombre/usuario del único Administrador sin disparar las reglas de integridad', () => {
      const actualizado = service.actualizar('dev-usuario-1', { nombre: 'Nombre actualizado' });

      expect(actualizado.nombre).toBe('Nombre actualizado');
      expect(actualizado.rol).toBe('Administrador');
      expect(actualizado.estado).toBe('Activo');
    });

    it('actualizar() permite que un Administrador se cambie a sí mismo a Usuario si existe otro Administrador activo', () => {
      service.actualizar('dev-usuario-2', { rol: 'Administrador' });

      const actualizado = service.actualizar('dev-usuario-1', { rol: 'Usuario' });

      expect(actualizado.rol).toBe('Usuario');
    });
  });
});
