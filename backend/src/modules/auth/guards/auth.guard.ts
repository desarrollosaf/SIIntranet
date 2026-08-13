import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Frontera de autenticación estable que exigirán los endpoints protegidos.
 * NO autentica credenciales: solo exige que `request.user` ya exista.
 * `request.user` deberá ser poblado por la fuente de identidad que se
 * defina al resolver D08 (todavía no implementada) — hasta entonces, este
 * guard rechaza honestamente toda petición.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
