export type EstadoFormato = 'Activo' | 'Inactivo';

export interface Formato {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  archivoId: string;
  fechaCreacion: string;
  estado: EstadoFormato;
}
