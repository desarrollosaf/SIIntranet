import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateFormatoDto {
  @IsString()
  @IsOptional()
  readonly nombre?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsString()
  @IsOptional()
  readonly categoria?: string;

  @IsString()
  @IsOptional()
  readonly archivo?: string;

  @IsString()
  @IsOptional()
  readonly tipoArchivo?: string;

  @IsString()
  @IsIn(['Activo', 'Inactivo'])
  @IsOptional()
  readonly estado?: 'Activo' | 'Inactivo';
}
