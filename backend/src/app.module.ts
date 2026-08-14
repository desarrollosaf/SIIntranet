import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './modules/auth/auth.module';
import { DevIdentityMiddleware } from './modules/auth/dev-identity/dev-identity.middleware';
import { ArchivosModule } from './modules/archivos/archivos.module';
import { MensajesModule } from './modules/mensajes/mensajes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Jest fija NODE_ENV=test automáticamente antes de que se ejecute
      // cualquier código de test (incluida la primera importación de este
      // módulo). Ignorar el .env real durante los tests evita que la
      // configuración local del desarrollador (p. ej. backend/.env creado
      // para pruebas manuales) filtre valores no controlados hacia
      // suites automatizadas — los tests ya fijan explícitamente las
      // variables que necesitan vía process.env.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    HealthModule,
    UsuariosModule,
    AuthModule,
    ArchivosModule,
    MensajesModule,
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    const nodeEnvIsDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const authModeIsDevelopment = this.configService.get<string>('AUTH_MODE') === 'development';

    if (authModeIsDevelopment && !nodeEnvIsDevelopment) {
      throw new Error(
        'Configuración inválida: AUTH_MODE=development requiere también NODE_ENV=development.',
      );
    }

    if (nodeEnvIsDevelopment && authModeIsDevelopment) {
      consumer.apply(DevIdentityMiddleware).forRoutes('*');
    }
  }
}
