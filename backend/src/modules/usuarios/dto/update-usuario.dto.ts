export class UpdateUsuarioDto {
  readonly nombre?: string;
  readonly usuario?: string;
  readonly correo?: string;
  readonly area?: string;
  readonly rol?: string;
  readonly estado?: 'Activo' | 'Inactivo';
  readonly requiereCambioPassword?: boolean;
}
