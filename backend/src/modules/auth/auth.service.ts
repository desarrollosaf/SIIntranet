import { Injectable } from '@nestjs/common';
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
    
    const match = this.usuariosService.findByUsername(username);

    if (match) {
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
    } else {
      return {
        user: {
          id: 888,
          nombre: loginDto.usuario,
          usuario: username,
          rol: 'Usuario',
        },
        requiresPasswordChange: false,
        token: null,
        mode: 'mock',
      };
    }
  }
}
