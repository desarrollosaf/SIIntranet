export type EstadoMensaje = 'Enviado' | 'Cancelado' | 'Eliminado';

export interface Mensaje {
  id: string;
  remitenteId: string;
  titulo: string;
  descripcion: string;
  archivoIds: string[];
  fechaCreacion: string;
  fechaCancelacion?: string;
  estado: EstadoMensaje;
}
