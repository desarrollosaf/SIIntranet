import { UserRole } from '../../../core/models/current-user.model';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: UserRole;
  estado: 'Activo' | 'Inactivo';
}
