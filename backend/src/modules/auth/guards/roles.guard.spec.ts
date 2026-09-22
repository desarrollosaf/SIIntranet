import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

class EndpointSinRoles {
  handler() {}
}

class EndpointSoloAdministrador {
  @Roles('Administrador')
  handler() {}
}

function crearContexto(
  target: object,
  handlerName: string,
  user?: AuthenticatedUser,
): ExecutionContext {
  const handler = (target as any)[handlerName];

  return {
    getHandler: () => handler,
    getClass: () => target.constructor,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  it('permite el acceso si el endpoint no declara @Roles', () => {
    const contexto = crearContexto(new EndpointSinRoles(), 'handler');

    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('permite el acceso si el actor tiene el rol requerido (Administrador)', () => {
    const contexto = crearContexto(new EndpointSoloAdministrador(), 'handler', {
      id: 'dev-usuario-1',
      usuario: 'usuario.prueba',
      rol: 'Administrador',
    });

    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('deniega el acceso si el actor tiene un rol distinto al requerido', () => {
    const contexto = crearContexto(new EndpointSoloAdministrador(), 'handler', {
      id: 'dev-usuario-2',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
    });

    expect(guard.canActivate(contexto)).toBe(false);
  });

  it('lanza UnauthorizedException si hay roles requeridos pero no hay identidad', () => {
    const contexto = crearContexto(new EndpointSoloAdministrador(), 'handler', undefined);

    expect(() => guard.canActivate(contexto)).toThrow(UnauthorizedException);
  });
});
