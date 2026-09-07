import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

    // ETAPA 16A (D-integridad de Administración): dejar de ser Administrador
    // no depende de quién lo solicita, solo de que siga existiendo al menos
    // otro Administrador activo tras el cambio — se permite incluso que un
    // Administrador se cambie a sí mismo a Usuario si hay otro activo.
    const dejaDeSerAdministrador =
      datos.rol !== undefined && datos.rol !== 'Administrador' && usuario.rol === 'Administrador';

    if (dejaDeSerAdministrador) {
      this.asegurarQuedanOtrosAdministradoresActivos(usuario.id);
    }

    Object.assign(usuario, datos);
    return { ...usuario };
  }

  cambiarEstado(id: string, estado: UserStatus, actorId: string): Usuario {
    const usuario = this.buscarPorIdInterno(id);

    if (estado === 'Inactivo') {
      // Regla 1: un Administrador no puede desactivar su propia cuenta,
      // exista o no otro Administrador activo — independiente de la Regla 2.
      if (usuario.id === actorId) {
        throw new ConflictException('Un Administrador no puede desactivarse a sí mismo.');
      }

      // Regla 2: desactivar a un Administrador no puede dejar al sistema sin
      // ningún Administrador activo.
      if (usuario.rol === 'Administrador') {
        this.asegurarQuedanOtrosAdministradoresActivos(usuario.id);
      }
    }

    usuario.estado = estado;
    return { ...usuario };
  }

  /**
   * Regla 2 (último Administrador activo): lanza ConflictException si,
   * excluyendo al usuario `id` (quien está a punto de dejar de contar como
   * Administrador activo, ya sea por cambio de rol o de estado), no queda
   * ningún otro Administrador con estado Activo. No depende de ids semilla
   * ni de un actor concreto — solo cuenta el estado real de `this.usuarios`,
   * por lo que sigue siendo válida cuando exista persistencia real.
   */
  private asegurarQuedanOtrosAdministradoresActivos(id: string): void {
    const quedanOtrosAdministradoresActivos = this.usuarios.some(
      (u) => u.id !== id && u.rol === 'Administrador' && u.estado === 'Activo',
    );

    if (!quedanOtrosAdministradoresActivos) {
      throw new ConflictException('Debe existir al menos un Administrador activo.');
    }
  }
}
