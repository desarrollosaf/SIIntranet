import { IsString, IsEmail, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  readonly nombre?: string;

  @IsString()
  @IsOptional()
  readonly usuario?: string;

  @IsEmail()
  @IsOptional()
  readonly correo?: string;

  @IsString()
  @IsOptional()
  readonly area?: string;

  @IsString()
  @IsOptional()
  readonly rol?: string;

  @IsString()
  @IsIn(['Activo', 'Inactivo'])
  @IsOptional()
  readonly estado?: 'Activo' | 'Inactivo';

  @IsBoolean()
  @IsOptional()
  readonly requiereCambioPassword?: boolean;
}
