export type UserRole = 'Usuario' | 'Administrador';

export interface CurrentUser {
  id: string;
  nombre: string;
  usuario: string;
  rol: UserRole;
}
