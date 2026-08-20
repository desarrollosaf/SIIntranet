export interface EnlaceInstitucional {
  readonly nombre: string;
  readonly url: string | null;
}

/**
 * Catálogo estático de V1. Las URL oficiales todavía no fueron entregadas
 * (ver ETAPA 15C.1) — mientras `url` sea `null`, el template no debe
 * renderizar un enlace real.
 */
export const ENLACES_INSTITUCIONALES: readonly EnlaceInstitucional[] = [
  { nombre: 'Cámara de Diputados del Estado de México', url: null },
  { nombre: 'Instituto de Estudios Legislativos', url: null },
  { nombre: 'Órgano Superior de Fiscalización', url: null },
  { nombre: 'Secretaría de Asuntos Parlamentarios', url: null },
  { nombre: 'Contraloría del Poder Legislativo', url: null },
];
