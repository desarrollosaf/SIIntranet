/**
 * Metadatos de un archivo subido. El contenido físico vive en el filesystem
 * provisional de desarrollo (fuera de este modelo); ver ArchivosService.
 *
 * `subidoPor` es metadata de creación y sostiene la regla de acceso
 * provisional (uploader-only). NO sustituye al futuro módulo de Auditoría
 * (D14) — cuando exista, registrará el evento de subida de forma
 * independiente, con su propio mecanismo.
 */
export interface Archivo {
  id: string;
  nombreOriginal: string;
  nombreAlmacenado: string;
  mimeType: string;
  tamano: number;
  fechaSubida: string;
  subidoPor: string;
}
