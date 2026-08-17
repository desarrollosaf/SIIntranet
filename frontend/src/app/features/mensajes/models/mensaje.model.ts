export type EstadoMensaje = 'Enviado' | 'Cancelado' | 'Eliminado';
export type EstadoLectura = 'Nuevo' | 'Visto';
export type EstadoRespuesta = 'Pendiente' | 'Respondido';

export interface UsuarioResumen {
  id: string;
  nombre: string;
  usuario: string;
}

export interface DestinatarioResumen {
  usuarioId: string;
  nombre: string;
  usuario: string;
  estadoLectura: EstadoLectura;
  estadoRespuesta: EstadoRespuesta;
}

export interface MensajeRecibido {
  id: string;
  remitente: UsuarioResumen;
  fechaCreacion: string;
  estado: EstadoMensaje;
  contenidoDisponible: boolean;
  estadoLectura: EstadoLectura;
  estadoRespuesta: EstadoRespuesta;
  titulo?: string;
  descripcion?: string;
  archivoIds?: string[];
}

export interface MensajeEnviado {
  id: string;
  fechaCreacion: string;
  estado: EstadoMensaje;
  contenidoDisponible: boolean;
  destinatarios: DestinatarioResumen[];
  titulo?: string;
  descripcion?: string;
  archivoIds?: string[];
}

export type MensajeDetalle = MensajeRecibido | MensajeEnviado;

export interface MensajeCreado {
  id: string;
  remitenteId: string;
  titulo: string;
  descripcion: string;
  archivoIds: string[];
  fechaCreacion: string;
  estado: EstadoMensaje;
}

export interface CrearMensajeDatos {
  titulo: string;
  descripcion: string;
  destinatarioIds: string[];
  archivoIds?: string[];
  respuestaAId?: string;
}

export interface ActualizarMensajeDatos {
  titulo?: string;
  descripcion?: string;
  destinatarioIds?: string[];
  archivoIds?: string[];
}

export function esMensajeRecibido(mensaje: MensajeDetalle): mensaje is MensajeRecibido {
  return 'remitente' in mensaje;
}
