import { IsNotEmpty, IsString, IsEmail, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  readonly usuario: string;

  @IsEmail()
  @IsNotEmpty()
  readonly correo: string;

  @IsString()
  @IsNotEmpty()
  readonly area: string;

  @IsString()
  @IsNotEmpty()
  readonly rol: string;

  @IsString()
  @IsIn(['Activo', 'Inactivo'])
  @IsNotEmpty()
  readonly estado: 'Activo' | 'Inactivo';

  @IsString()
  @IsOptional()
  readonly password?: string;

  @IsBoolean()
  @IsOptional()
  readonly requiereCambioPassword?: boolean;
}
