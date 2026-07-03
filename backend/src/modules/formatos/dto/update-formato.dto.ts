export class UpdateFormatoDto {
  readonly nombre?: string;
  readonly descripcion?: string;
  readonly categoria?: string;
  readonly archivo?: string;
  readonly tipoArchivo?: string;
  readonly estado?: 'Activo' | 'Inactivo';
}
