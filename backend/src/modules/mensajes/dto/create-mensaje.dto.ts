export class CreateMensajeDto {
  readonly titulo: string;
  readonly descripcion: string;
  readonly remitente: string;
  readonly destinatarios: string;
  readonly documento: string;
  readonly fecha?: string;
  readonly hora?: string;
  readonly estado?: 'Enviando' | 'Nuevo' | 'Visto' | 'Respondido' | 'Cancelado' | 'Eliminado' | 'Enviado' | 'Pendiente';
  readonly tipoMensaje?: 'recibido' | 'enviado';
}
