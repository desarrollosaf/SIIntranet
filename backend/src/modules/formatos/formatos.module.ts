import { Module } from '@nestjs/common';
import { FormatosController } from './formatos.controller';
import { FormatosService } from './formatos.service';
import { ArchivosModule } from '../archivos/archivos.module';

@Module({
  imports: [ArchivosModule],
  controllers: [FormatosController],
  providers: [FormatosService],
})
export class FormatosModule {}
