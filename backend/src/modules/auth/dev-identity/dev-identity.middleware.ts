import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class DevIdentityMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {}

  use(req: RequestWithUser, _res: Response, next: NextFunction): void {
    delete req.user;
    try {
      const devUserId = this.configService.get<string>('DEV_USER_ID');

      if (!devUserId) {
        throw new Error(
          'DEV_USER_ID no está configurado, pero la identidad de desarrollo está activa (AUTH_MODE=development).',
        );
      }

      const usuario = this.usuariosService.obtenerPorId(devUserId);

      if (usuario.estado !== 'Activo') {
        throw new UnauthorizedException('La cuenta está inactiva.');
      }

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
