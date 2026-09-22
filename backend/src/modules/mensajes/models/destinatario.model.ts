export type EstadoLectura = 'Nuevo' | 'Visto';
export type EstadoRespuesta = 'Pendiente' | 'Respondido';

export interface DestinatarioMensaje {
  id: string;
  mensajeId: string;
  usuarioId: string;
  estadoLectura: EstadoLectura;
  estadoRespuesta: EstadoRespuesta;
}
