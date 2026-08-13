import { Injectable, NotFoundException } from '@nestjs/common';
import { Usuario, UserStatus } from './models/usuario.model';

type DatosActualizables = Partial<Pick<Usuario, 'nombre' | 'usuario' | 'rol'>>;

@Injectable()
export class UsuariosService {
  /**
   * Datos exclusivamente de desarrollo, en memoria. Se pierden al reiniciar
   * el proceso. Serán reemplazados por la integración con la MySQL
   * institucional cuando su esquema esté autorizado — no son datos de
   * producción ni provienen de V1.
   */
  private readonly usuarios: Usuario[] = [
    {
      id: 'dev-usuario-1',
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
      estado: 'Activo',
    },
    {
      id: 'dev-usuario-2',
      nombre: 'Usuario de Prueba Dos',
      usuario: 'usuario.prueba.dos',
      rol: 'Usuario',
      estado: 'Activo',
    },
    {
      id: 'dev-usuario-3',
      nombre: 'Usuario de Prueba Tres',
      usuario: 'usuario.prueba.tres',
      rol: 'Usuario',
      estado: 'Inactivo',
    },
  ];

  // La creación de usuarios se difiere: requiere una contraseña inicial para
  // ser funcional, y el manejo de credenciales sigue fuera de alcance hasta
  // que exista el módulo de autenticación backend.

  private buscarPorIdInterno(id: string): Usuario {
    const usuario = this.usuarios.find((u) => u.id === id);

    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return usuario;
  }

  listar(): Usuario[] {
    return this.usuarios.map((usuario) => ({ ...usuario }));
  }

  obtenerPorId(id: string): Usuario {
    return { ...this.buscarPorIdInterno(id) };
  }

  actualizar(id: string, datos: DatosActualizables): Usuario {
    const usuario = this.buscarPorIdInterno(id);
    Object.assign(usuario, datos);
    return { ...usuario };
  }

  cambiarEstado(id: string, estado: UserStatus): Usuario {
    const usuario = this.buscarPorIdInterno(id);
    usuario.estado = estado;
    return { ...usuario };
  }
}
