import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/types/user-role.type';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Autorización, no autenticación: compara el rol de una identidad ya
 * aceptada contra los roles declarados en el endpoint. Si no hay identidad,
 * el problema es de autenticación (401), no de permisos (403) — por eso
 * lanza UnauthorizedException en vez de devolver false en ese caso.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    return rolesRequeridos.includes(request.user.rol);
  }
}
