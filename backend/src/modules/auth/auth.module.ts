import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
})
export class AuthModule {}
