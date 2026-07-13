import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Usuario } from '../../common/interfaces/common.interfaces';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  private usuarios: Usuario[] = [];
  private nextId = 1;

  private sanitizeUsuario(usuario: Usuario): Omit<Usuario, 'password'> {
    const { password, ...sanitized } = usuario;
    return sanitized;
  }

  private findRawOne(id: number): Usuario {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  getStatus() {
    return {
      module: 'usuarios',
      status: 'ready',
      database: 'not-connected',
    };
  }

  findAll(): Omit<Usuario, 'password'>[] {
    return this.usuarios.map(u => this.sanitizeUsuario(u));
  }

  findOne(id: number): Omit<Usuario, 'password'> {
    return this.sanitizeUsuario(this.findRawOne(id));
  }

  create(createUsuarioDto: CreateUsuarioDto): Omit<Usuario, 'password'> {
    const usuarioDuplicado = this.usuarios.find(
      u => u.usuario.toLowerCase() === createUsuarioDto.usuario.toLowerCase()
    );
    if (usuarioDuplicado) {
      throw new ConflictException('El nombre de usuario ya está registrado.');
    }

    const correoDuplicado = this.usuarios.find(
      u => u.correo.toLowerCase() === createUsuarioDto.correo.toLowerCase()
    );
    if (correoDuplicado) {
      throw new ConflictException('El correo ya está registrado.');
    }

    const nuevoUsuario: Usuario = {
      id: this.nextId++,
      nombre: createUsuarioDto.nombre,
      usuario: createUsuarioDto.usuario,
      correo: createUsuarioDto.correo,
      area: createUsuarioDto.area,
      rol: createUsuarioDto.rol,
      estado: createUsuarioDto.estado,
      password: createUsuarioDto.password || '12345678',
      requiereCambioPassword: createUsuarioDto.requiereCambioPassword ?? false,
    };
    this.usuarios.push(nuevoUsuario);
    return this.sanitizeUsuario(nuevoUsuario);
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto): Omit<Usuario, 'password'> {
    const usuario = this.findRawOne(id);

    if (updateUsuarioDto.usuario !== undefined) {
      const usuarioDuplicado = this.usuarios.find(
        u => u.id !== id && u.usuario.toLowerCase() === updateUsuarioDto.usuario!.toLowerCase()
      );
      if (usuarioDuplicado) {
        throw new ConflictException('El nombre de usuario ya está registrado.');
      }
    }

    if (updateUsuarioDto.correo !== undefined) {
      const correoDuplicado = this.usuarios.find(
        u => u.id !== id && u.correo.toLowerCase() === updateUsuarioDto.correo!.toLowerCase()
      );
      if (correoDuplicado) {
        throw new ConflictException('El correo ya está registrado.');
      }
    }
    
    if (updateUsuarioDto.nombre !== undefined) usuario.nombre = updateUsuarioDto.nombre;
    if (updateUsuarioDto.usuario !== undefined) usuario.usuario = updateUsuarioDto.usuario;
    if (updateUsuarioDto.correo !== undefined) usuario.correo = updateUsuarioDto.correo;
    if (updateUsuarioDto.area !== undefined) usuario.area = updateUsuarioDto.area;
    if (updateUsuarioDto.rol !== undefined) usuario.rol = updateUsuarioDto.rol;
    if (updateUsuarioDto.estado !== undefined) usuario.estado = updateUsuarioDto.estado;
    if (updateUsuarioDto.requiereCambioPassword !== undefined) {
      usuario.requiereCambioPassword = updateUsuarioDto.requiereCambioPassword;
    }

    return this.sanitizeUsuario(usuario);
  }

  changePassword(id: number, passwordNueva: string): { success: boolean } {
    const usuario = this.findRawOne(id);
    usuario.password = passwordNueva;
    usuario.requiereCambioPassword = false;
    return { success: true };
  }

  remove(id: number): Omit<Usuario, 'password'> {
    const usuario = this.findRawOne(id);
    usuario.estado = 'Inactivo';
    return this.sanitizeUsuario(usuario);
  }

  findByUsername(username: string): Usuario | undefined {
    return this.usuarios.find(
      u => u.usuario.toLowerCase() === username.toLowerCase() ||
           u.correo.toLowerCase() === username.toLowerCase()
    );
  }
}
