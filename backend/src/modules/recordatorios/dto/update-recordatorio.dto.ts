import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateRecordatorioDto {
  @IsString()
  @IsOptional()
  readonly titulo?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsString()
  @IsOptional()
  readonly fecha?: string;

  @IsString()
  @IsOptional()
  readonly hora?: string;

  @IsString()
  @IsIn(['Activo', 'Inactivo', 'Eliminado'])
  @IsOptional()
  readonly estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
