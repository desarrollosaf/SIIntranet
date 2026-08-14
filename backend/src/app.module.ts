import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './modules/auth/auth.module';
import { DevIdentityMiddleware } from './modules/auth/dev-identity/dev-identity.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    UsuariosModule,
    AuthModule,
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
