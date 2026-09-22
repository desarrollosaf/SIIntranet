import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Usuario, UserStatus } from './models/usuario.model';

type DatosActualizables = Partial<Pick<Usuario, 'nombre' | 'usuario' | 'rol'>>;

@Injectable()
export class UsuariosService {
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

    const dejaDeSerAdministrador =
      datos.rol !== undefined && datos.rol !== 'Administrador' && usuario.rol === 'Administrador';

    if (dejaDeSerAdministrador) {
      this.asegurarQuedanOtrosAdministradoresActivos(usuario.id);
    }

    if (
      datos.usuario !== undefined &&
      this.usuarios.some((otro) => otro.id !== id && otro.usuario === datos.usuario)
    ) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    if (datos.nombre !== undefined) usuario.nombre = datos.nombre;
    if (datos.usuario !== undefined) usuario.usuario = datos.usuario;
    if (datos.rol !== undefined) usuario.rol = datos.rol;
    return { ...usuario };
  }

  cambiarEstado(id: string, estado: UserStatus, actorId: string): Usuario {
    const usuario = this.buscarPorIdInterno(id);

    if (estado === 'Inactivo') {
      if (usuario.id === actorId) {
        throw new ConflictException('Un Administrador no puede desactivarse a sí mismo.');
      }

      if (usuario.rol === 'Administrador') {
        this.asegurarQuedanOtrosAdministradoresActivos(usuario.id);
      }
    }

    usuario.estado = estado;
    return { ...usuario };
  }

  private asegurarQuedanOtrosAdministradoresActivos(id: string): void {
    const quedanOtrosAdministradoresActivos = this.usuarios.some(
      (u) => u.id !== id && u.rol === 'Administrador' && u.estado === 'Activo',
    );

    if (!quedanOtrosAdministradoresActivos) {
      throw new ConflictException('Debe existir al menos un Administrador activo.');
    }
  }
}
