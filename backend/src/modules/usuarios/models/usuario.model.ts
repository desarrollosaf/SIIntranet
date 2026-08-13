export type UserRole = 'Usuario' | 'Administrador';
export type UserStatus = 'Activo' | 'Inactivo';

/**
 * Modelo funcional mínimo, interno al backend. NO representa todavía el
 * esquema físico de la MySQL institucional (aún no autorizado/conocido).
 * Campos dependientes de esa base (correo, área, puesto, número de empleado,
 * password) quedan deliberadamente fuera hasta conocer el esquema real.
 */
export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: UserRole;
  estado: UserStatus;
}
