export type EstadoMensaje = 'Enviado' | 'Cancelado' | 'Eliminado';

/**
 * El documento en sí. La relación con cada destinatario (lectura/respuesta
 * individuales) vive en DestinatarioMensaje, no aquí — ver esa interfaz.
 *
 * NO incluye 'Enviando': ese es un estado transitorio de UI mientras
 * POST /mensajes está pendiente, nunca un estado persistente real (la
 * creación en este backend es síncrona).
 */
export interface Mensaje {
  id: string;
  remitenteId: string;
  titulo: string;
  descripcion: string;
  archivoIds: string[];
  fechaCreacion: string;
  estado: EstadoMensaje;
}
