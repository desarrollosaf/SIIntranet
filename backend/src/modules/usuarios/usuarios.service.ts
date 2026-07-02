import { Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '../../common/interfaces/common.interfaces';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  private usuarios: Usuario[] = [];
  private nextId = 1;

  getStatus() {
    return {
      module: 'usuarios',
      status: 'ready',
      database: 'not-connected',
    };
  }

  findAll(): Usuario[] {
    return this.usuarios;
  }

  findOne(id: number): Usuario {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  create(createUsuarioDto: CreateUsuarioDto): Usuario {
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
    return nuevoUsuario;
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto): Usuario {
    const usuario = this.findOne(id);
    
    if (updateUsuarioDto.nombre !== undefined) usuario.nombre = updateUsuarioDto.nombre;
    if (updateUsuarioDto.usuario !== undefined) usuario.usuario = updateUsuarioDto.usuario;
    if (updateUsuarioDto.correo !== undefined) usuario.correo = updateUsuarioDto.correo;
    if (updateUsuarioDto.area !== undefined) usuario.area = updateUsuarioDto.area;
    if (updateUsuarioDto.rol !== undefined) usuario.rol = updateUsuarioDto.rol;
    if (updateUsuarioDto.estado !== undefined) usuario.estado = updateUsuarioDto.estado;
    if (updateUsuarioDto.requiereCambioPassword !== undefined) {
      usuario.requiereCambioPassword = updateUsuarioDto.requiereCambioPassword;
    }

    return usuario;
  }

  changePassword(id: number, passwordNueva: string): { success: boolean } {
    const usuario = this.findOne(id);
    usuario.password = passwordNueva;
    usuario.requiereCambioPassword = false;
    return { success: true };
  }

  remove(id: number): Usuario {
    const usuario = this.findOne(id);
    usuario.estado = 'Inactivo';
    return usuario;
  }

  findByUsername(username: string): Usuario | undefined {
    return this.usuarios.find(
      u => u.usuario.toLowerCase() === username.toLowerCase() ||
           u.correo.toLowerCase() === username.toLowerCase()
    );
  }
}
