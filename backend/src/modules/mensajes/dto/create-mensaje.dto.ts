import { ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMensajeDto {
  @IsString()
  @IsNotEmpty()
  readonly titulo: string;

  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  readonly destinatarioIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  readonly archivoIds?: string[];

  /**
   * Presente únicamente cuando este mensaje es una respuesta. Es un dato de
   * comando de creación (dispara la validación y el efecto secundario
   * descritos en MensajesService.crear) — no se persiste como enlace en
   * Mensaje en esta primera versión.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly respuestaAId?: string;
}
