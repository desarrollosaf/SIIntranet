import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { MensajesModule } from './modules/mensajes/mensajes.module';
import { FormatosModule } from './modules/formatos/formatos.module';
import { RecordatoriosModule } from './modules/recordatorios/recordatorios.module';
import { ArchivosModule } from './modules/archivos/archivos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    UsuariosModule,
    MensajesModule,
    FormatosModule,
    RecordatoriosModule,
    ArchivosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
