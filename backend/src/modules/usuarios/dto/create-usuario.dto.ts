export class CreateUsuarioDto {
  readonly nombre: string;
  readonly usuario: string;
  readonly correo: string;
  readonly area: string;
  readonly rol: string;
  readonly estado: 'Activo' | 'Inactivo';
  readonly password?: string;
  readonly requiereCambioPassword?: boolean;
}
