export class CreateRecordatorioDto {
  readonly titulo: string;
  readonly descripcion: string;
  readonly fecha: string;
  readonly hora: string;
  readonly tipo: 'recordatorio';
  readonly creadoPor: string;
  readonly estado?: 'Activo' | 'Inactivo' | 'Eliminado';
}
