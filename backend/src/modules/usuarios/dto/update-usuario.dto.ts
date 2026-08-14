import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { UserRole } from '../../../common/types/user-role.type';

export class UpdateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly nombre?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly usuario?: string;

  @IsIn(['Usuario', 'Administrador'])
  @IsOptional()
  readonly rol?: UserRole;
}
