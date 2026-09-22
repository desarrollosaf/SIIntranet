import { IsIn, IsNotEmpty, ValidateIf, IsString } from 'class-validator';
import type { UserRole } from '../../../common/types/user-role.type';

export class UpdateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  readonly nombre?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  readonly usuario?: string;

  @IsIn(['Usuario', 'Administrador'])
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  readonly rol?: UserRole;
}
