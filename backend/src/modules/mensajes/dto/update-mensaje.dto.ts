export class UpdateMensajeDto {
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly destinatarios?: string;
  readonly documento?: string;
  readonly estado?: 'Enviando' | 'Nuevo' | 'Visto' | 'Respondido' | 'Cancelado' | 'Eliminado' | 'Enviado' | 'Pendiente';
}
