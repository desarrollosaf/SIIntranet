import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateRecordatorioDto {
  @IsString()
  @IsNotEmpty()
  readonly titulo: string;

  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsString()
  @IsNotEmpty()
  readonly fecha: string;

  @IsString()
  @IsNotEmpty()
  readonly hora: string;

  @IsString()
  @IsIn(['recordatorio'])
  @IsNotEmpty()
  readonly tipo: 'recordatorio';

  @IsString()
  @IsNotEmpty()
  readonly creadoPor: string;

  @IsString()
  @IsIn(['Activo', 'Inactivo', 'Eliminado'])
  @IsOptional()
  readonly estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
