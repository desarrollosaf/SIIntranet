export class UpdateRecordatorioDto {
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly fecha?: string;
  readonly hora?: string;
  readonly estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
