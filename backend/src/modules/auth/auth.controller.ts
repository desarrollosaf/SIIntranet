import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() actor: AuthenticatedUser) {
    const usuario = this.usuariosService.obtenerPorId(actor.id);

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      rol: usuario.rol,
    };
  }
}
