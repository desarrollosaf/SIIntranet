import { IsIn } from 'class-validator';
import type { UserStatus } from '../models/usuario.model';

export class UpdateEstadoUsuarioDto {
  @IsIn(['Activo', 'Inactivo'])
  readonly estado: UserStatus;
}
