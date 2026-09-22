import { UserRole } from '../../../common/types/user-role.type';

export type UserStatus = 'Activo' | 'Inactivo';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: UserRole;
  estado: UserStatus;
}
