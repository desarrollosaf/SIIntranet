import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from '../../common/interfaces/common.interfaces';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService) {}

  getStatus() {
    return {
      module: 'auth',
      status: 'ready',
      database: 'not-connected',
    };
  }

  login(loginDto: LoginDto): LoginResponse {
    const username = (loginDto.usuario || '').trim().toLowerCase();
    const password = loginDto.password || '';
    
    const match = this.usuariosService.findByUsername(username);

    if (match) {
      if (match.estado === 'Inactivo') {
        throw new ForbiddenException('El usuario se encuentra inactivo. Contacte al administrador.');
      }
      if (match.password !== password) {
        throw new UnauthorizedException('Usuario o contraseña incorrectos.');
      }
      return {
        user: {
          id: match.id,
          nombre: match.nombre,
          usuario: match.usuario,
          rol: match.rol,
        },
        requiresPasswordChange: match.requiereCambioPassword ?? false,
        token: null,
        mode: 'mock',
      };
    }

    if (username === 'admin') {
      if (password !== '123') {
        throw new UnauthorizedException('Usuario o contraseña incorrectos.');
      }
      return {
        user: {
          id: 999,
          nombre: 'Administrador del sistema',
          usuario: 'admin',
          rol: 'Administrador',
        },
        requiresPasswordChange: false,
        token: null,
        mode: 'mock',
      };
    }

    throw new UnauthorizedException('Usuario o contraseña incorrectos.');
  }
}
