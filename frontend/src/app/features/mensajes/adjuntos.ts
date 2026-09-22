import { WritableSignal } from '@angular/core';
import { Archivo } from '../archivos/models/archivo.model';

export interface SeleccionArchivo {
  file: File;
  archivoSubido?: Archivo;
}

export async function subirAdjuntosPendientes(
  seleccion: WritableSignal<SeleccionArchivo[]>,
  subir: (file: File) => Promise<Archivo>,
): Promise<void> {
  for (const item of seleccion()) {
    if (item.archivoSubido) continue;
    const archivoSubido = await subir(item.file);
    seleccion.update((actual) =>
      actual.map((pendiente) => (pendiente === item ? { ...pendiente, archivoSubido } : pendiente)),
    );
  }
}
