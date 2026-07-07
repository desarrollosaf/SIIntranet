import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateFormatoDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsString()
  @IsNotEmpty()
  readonly categoria: string;

  @IsString()
  @IsNotEmpty()
  readonly archivo: string;

  @IsString()
  @IsNotEmpty()
  readonly tipoArchivo: string;

  @IsString()
  @IsIn(['Activo', 'Inactivo'])
  @IsOptional()
  readonly estado?: 'Activo' | 'Inactivo';
}
