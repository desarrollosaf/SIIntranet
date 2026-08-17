import { IsIn } from 'class-validator';
import type { EstadoFormato } from '../models/formato.model';

export class UpdateEstadoFormatoDto {
  @IsIn(['Activo', 'Inactivo'])
  readonly estado: EstadoFormato;
}
