import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

function crearContexto(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  it('permite el acceso si request.user existe', () => {
    const contexto = crearContexto({ id: 'dev-usuario-1', usuario: 'usuario.prueba', rol: 'Usuario' });

    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('lanza UnauthorizedException si request.user no existe', () => {
    const contexto = crearContexto(undefined);

    expect(() => guard.canActivate(contexto)).toThrow(UnauthorizedException);
  });
});
