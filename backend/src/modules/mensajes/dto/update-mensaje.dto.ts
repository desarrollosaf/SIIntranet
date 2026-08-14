import { ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMensajeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly descripcion?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  readonly destinatarioIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  readonly archivoIds?: string[];
}
