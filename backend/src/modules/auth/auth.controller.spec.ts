import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [UsuariosService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('devuelve la identidad del backend enriquecida con el nombre', () => {
    const actor: AuthenticatedUser = {
      id: 'dev-usuario-1',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    };

    const resultado = controller.me(actor);

    expect(resultado).toEqual({
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    });
  });

  it('nunca devuelve password ni campos ajenos al contrato', () => {
    const actor: AuthenticatedUser = {
      id: 'dev-usuario-2',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
    };

    const resultado = controller.me(actor) as Record<string, unknown>;

    expect(Object.keys(resultado).sort()).toEqual(['id', 'nombre', 'rol', 'usuario']);
    expect(resultado['password']).toBeUndefined();
  });
});
