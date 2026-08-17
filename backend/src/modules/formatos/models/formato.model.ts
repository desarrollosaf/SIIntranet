export type EstadoFormato = 'Activo' | 'Inactivo';

/**
 * El documento institucional en sí. NO guarda nada del archivo físico
 * (nombre, ruta, mimeType) — eso vive exclusivamente en Archivo y se
 * proyecta al vuelo en la respuesta pública (ver FormatosService).
 */
export interface Formato {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  archivoId: string;
  fechaCreacion: string;
  estado: EstadoFormato;
}
