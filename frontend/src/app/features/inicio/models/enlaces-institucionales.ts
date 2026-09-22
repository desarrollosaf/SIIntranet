export interface EnlaceInstitucional {
  readonly nombre: string;
  readonly url: string | null;
}

export const ENLACES_INSTITUCIONALES: readonly EnlaceInstitucional[] = [
  { nombre: 'Cámara de Diputados del Estado de México', url: null },
  { nombre: 'Instituto de Estudios Legislativos', url: null },
  { nombre: 'Órgano Superior de Fiscalización', url: null },
  { nombre: 'Secretaría de Asuntos Parlamentarios', url: null },
  { nombre: 'Contraloría del Poder Legislativo', url: null },
];
