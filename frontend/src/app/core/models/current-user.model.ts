export type UserRole = 'Usuario' | 'Administrador';

export interface CurrentUser {
  nombre: string;
  rol: UserRole;
}
