import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFormatoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly descripcion?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly categoria?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly archivoId?: string;
}
