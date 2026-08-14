import { NotFoundException } from '@nestjs/common';
import { DevIdentityMiddleware } from './dev-identity.middleware';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { ConfigService } from '@nestjs/config';

describe('DevIdentityMiddleware', () => {
  let usuariosService: UsuariosService;

  beforeEach(() => {
    usuariosService = new UsuariosService();
  });

  function crearConfigService(devUserId?: string): ConfigService {
    return {
      get: (key: string) => (key === 'DEV_USER_ID' ? devUserId : undefined),
    } as unknown as ConfigService;
  }

  it('con DEV_USER_ID válido, construye request.user con id/usuario/rol y llama next()', () => {
    const middleware = new DevIdentityMiddleware(crearConfigService('dev-usuario-1'), usuariosService);
    const req: any = {};
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(req.user).toEqual({
      id: 'dev-usuario-1',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('el cliente no puede influir en la identidad: req.user se sobrescribe con el actor del servidor', () => {
    const middleware = new DevIdentityMiddleware(crearConfigService('dev-usuario-2'), usuariosService);
    const req: any = { user: { id: 'lo-que-sea', usuario: 'atacante', rol: 'Administrador' } };
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(req.user).toEqual({
      id: 'dev-usuario-2',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
    });
  });

  it('sin DEV_USER_ID configurado, falla explícitamente vía next(error)', () => {
    const middleware = new DevIdentityMiddleware(crearConfigService(undefined), usuariosService);
    const req: any = {};
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(req.user).toBeUndefined();
  });

  it('con DEV_USER_ID que no corresponde a ningún usuario, falla explícitamente', () => {
    const middleware = new DevIdentityMiddleware(crearConfigService('no-existe'), usuariosService);
    const req: any = {};
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
    expect(req.user).toBeUndefined();
  });
});
