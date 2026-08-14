import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ArchivosController } from './archivos.controller';
import { ArchivosService } from './archivos.service';

// Fallback de desarrollo si ARCHIVOS_MAX_BYTES falta o es inválido — mismo
// valor sugerido en .env.example (10 MiB), técnico y provisional, no una
// política institucional (D17: tamaño máximo real pendiente).
const TAMANO_MAXIMO_FALLBACK_BYTES = 10 * 1024 * 1024;

const logger = new Logger('ArchivosModule');

function resolverTamanoMaximoBytes(configService: ConfigService): number {
  const valorConfigurado = configService.get<string>('ARCHIVOS_MAX_BYTES');
  const parseado = Number(valorConfigurado);

  if (!valorConfigurado || !Number.isFinite(parseado) || parseado <= 0) {
    logger.warn(
      `ARCHIVOS_MAX_BYTES ausente o inválido ("${valorConfigurado}"); usando fallback de ${TAMANO_MAXIMO_FALLBACK_BYTES} bytes (10 MiB, provisional).`,
    );
    return TAMANO_MAXIMO_FALLBACK_BYTES;
  }

  return parseado;
}

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Sin `storage` explícito: Multer usa memoryStorage() por defecto,
      // necesaria para que ArchivosService reciba file.buffer y pueda
      // validar el contenido real antes de escribir a disco.
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: resolverTamanoMaximoBytes(configService),
        },
      }),
    }),
  ],
  controllers: [ArchivosController],
  providers: [ArchivosService],
})
export class ArchivosModule {}
