import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  let usuariosService: { listar: jest.Mock; obtenerPorId: jest.Mock; actualizar: jest.Mock; cambiarEstado: jest.Mock };

  beforeEach(async () => {
    usuariosService = {
      listar: jest.fn().mockReturnValue(['usuarios']),
      obtenerPorId: jest.fn().mockReturnValue({ id: 'dev-usuario-1' }),
      actualizar: jest.fn().mockReturnValue({ id: 'dev-usuario-1', nombre: 'Nuevo' }),
      cambiarEstado: jest.fn().mockReturnValue({ id: 'dev-usuario-1', estado: 'Inactivo' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{ provide: UsuariosService, useValue: usuariosService }],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('listar() delega en UsuariosService.listar()', () => {
    expect(controller.listar()).toEqual(['usuarios']);
    expect(usuariosService.listar).toHaveBeenCalled();
  });

  it('obtenerPorId() delega con el id recibido', () => {
    expect(controller.obtenerPorId('dev-usuario-1')).toEqual({ id: 'dev-usuario-1' });
    expect(usuariosService.obtenerPorId).toHaveBeenCalledWith('dev-usuario-1');
  });

  it('actualizar() delega el id y el DTO', () => {
    const dto = { nombre: 'Nuevo' };

    controller.actualizar('dev-usuario-1', dto);

    expect(usuariosService.actualizar).toHaveBeenCalledWith('dev-usuario-1', dto);
  });

  it('cambiarEstado() delega el id y el estado del DTO', () => {
    controller.cambiarEstado('dev-usuario-1', { estado: 'Inactivo' });

    expect(usuariosService.cambiarEstado).toHaveBeenCalledWith('dev-usuario-1', 'Inactivo');
  });
});
