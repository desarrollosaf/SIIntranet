import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateMensajeDto {
  @IsString()
  @IsOptional()
  readonly titulo?: string;

  @IsString()
  @IsOptional()
  readonly descripcion?: string;

  @IsString()
  @IsOptional()
  readonly destinatarios?: string;

  @IsString()
  @IsOptional()
  readonly documento?: string;

  @IsString()
  @IsIn(['Enviando', 'Nuevo', 'Visto', 'Respondido', 'Cancelado', 'Eliminado', 'Enviado', 'Pendiente'])
  @IsOptional()
  readonly estado?: 'Enviando' | 'Nuevo' | 'Visto' | 'Respondido' | 'Cancelado' | 'Eliminado' | 'Enviado' | 'Pendiente';
}
