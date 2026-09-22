import { UserRole } from '../types/user-role.type';

export interface AuthenticatedUser {
  id: string;
  usuario: string;
  rol: UserRole;
}
