import { UserRole } from '../types/user-role.type';

/**
 * Identidad mínima aceptada para una petición, no un registro persistido.
 * No implica que el estado Activo/Inactivo de la cuenta se revalide en cada
 * request — esa política depende del mecanismo de identidad definitivo (D08),
 * todavía no implementado.
 */
export interface AuthenticatedUser {
  id: string;
  usuario: string;
  rol: UserRole;
}
