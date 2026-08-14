import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Solo debe usarse en rutas protegidas por AuthGuard, que ya garantiza que
 * request.user existe antes de que este decorator se resuelva.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user as AuthenticatedUser;
  },
);
