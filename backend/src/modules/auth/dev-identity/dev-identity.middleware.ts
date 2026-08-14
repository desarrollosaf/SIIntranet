import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Identidad exclusiva de desarrollo, temporal y sustituible cuando D08 se
 * resuelva. Solo se registra si AppModule decide activarla (NODE_ENV=
 * development Y AUTH_MODE=development, ver app.module.ts). El cliente nunca
 * elige DEV_USER_ID ni el rol resultante — ambos vienen exclusivamente de la
 * configuración del servidor.
 */
@Injectable()
export class DevIdentityMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {}

  use(req: RequestWithUser, res: Response, next: NextFunction): void {
    try {
      const devUserId = this.configService.get<string>('DEV_USER_ID');

      if (!devUserId) {
        throw new Error(
          'DEV_USER_ID no está configurado, pero la identidad de desarrollo está activa (AUTH_MODE=development).',
        );
      }

      const usuario = this.usuariosService.obtenerPorId(devUserId);

      req.user = {
        id: usuario.id,
        usuario: usuario.usuario,
        rol: usuario.rol,
      };

      next();
    } catch (error) {
      next(error);
    }
  }
}
