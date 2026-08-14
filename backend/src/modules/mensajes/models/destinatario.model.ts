export type EstadoLectura = 'Nuevo' | 'Visto';
export type EstadoRespuesta = 'Pendiente' | 'Respondido';

/**
 * Relación entre un Mensaje y una persona a la que se envió. Lectura y
 * respuesta son independientes por destinatario (D13) — nunca campos
 * globales del Mensaje.
 */
export interface DestinatarioMensaje {
  id: string;
  mensajeId: string;
  usuarioId: string;
  estadoLectura: EstadoLectura;
  estadoRespuesta: EstadoRespuesta;
}
