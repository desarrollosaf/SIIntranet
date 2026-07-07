import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  readonly usuario: string;

  @IsString()
  @IsOptional()
  readonly password?: string;
}
