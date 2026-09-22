import type { Archivo } from '../../archivos/models/archivo.model';

export type EstadoFormato = 'Activo' | 'Inactivo';

export interface Formato {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  fechaCreacion: string;
  estado: EstadoFormato;
  archivo: Archivo;
}
