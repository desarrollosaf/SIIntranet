import { Module } from '@nestjs/common';
import { MensajesController } from './mensajes.controller';
import { MensajesService } from './mensajes.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ArchivosModule } from '../archivos/archivos.module';

@Module({
  imports: [UsuariosModule, ArchivosModule],
  controllers: [MensajesController],
  providers: [MensajesService],
})
export class MensajesModule {}
