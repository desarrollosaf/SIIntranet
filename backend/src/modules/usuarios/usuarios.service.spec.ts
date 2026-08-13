import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
    const actualizado = service.cambiarEstado('dev-usuario-1', 'Inactivo');

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
});
