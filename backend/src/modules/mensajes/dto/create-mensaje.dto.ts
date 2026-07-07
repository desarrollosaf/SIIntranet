import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateMensajeDto {
  @IsString()
  @IsNotEmpty()
  readonly titulo: string;

  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;

  @IsString()
  @IsNotEmpty()
  readonly remitente: string;

  @IsString()
  @IsNotEmpty()
  readonly destinatarios: string;

  @IsString()
  @IsNotEmpty()
  readonly documento: string;

  @IsString()
  @IsOptional()
  readonly fecha?: string;

  @IsString()
  @IsOptional()
  readonly hora?: string;

  @IsString()
  @IsIn(['Enviando', 'Nuevo', 'Visto', 'Respondido', 'Cancelado', 'Eliminado', 'Enviado', 'Pendiente'])
  @IsOptional()
  readonly estado?: 'Enviando' | 'Nuevo' | 'Visto' | 'Respondido' | 'Cancelado' | 'Eliminado' | 'Enviado' | 'Pendiente';

  @IsString()
  @IsIn(['recibido', 'enviado'])
  @IsOptional()
  readonly tipoMensaje?: 'recibido' | 'enviado';
}
