import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ArchivosService, sanearNombreParaDescarga } from './archivos.service';
import type { Archivo } from './models/archivo.model';

@Controller('archivos')
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async subir(@UploadedFile() file: Express.Multer.File, @CurrentUser() actor: AuthenticatedUser) {
    const archivo = await this.archivosService.guardar(file, actor.id);
    return this.aRespuestaPublica(archivo);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  obtener(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    const archivo = this.archivosService.obtenerPorId(id, actor.id);
    return this.aRespuestaPublica(archivo);
  }

  @UseGuards(AuthGuard)
  @Get(':id/descarga')
  async descargar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { archivo, rutaFisica } = await this.archivosService.obtenerParaDescarga(id, actor.id);

    // res.attachment() delega en el paquete `content-disposition` (el mismo
    // que usa Express internamente), que escapa/codifica el nombre de forma
    // segura frente a inyección de cabeceras — no se construye el header a mano.
    res.attachment(sanearNombreParaDescarga(archivo.nombreOriginal));
    res.setHeader('Content-Type', archivo.mimeType);

    return new StreamableFile(createReadStream(rutaFisica));
  }

  private aRespuestaPublica(archivo: Archivo) {
    return {
      id: archivo.id,
      nombreOriginal: archivo.nombreOriginal,
      mimeType: archivo.mimeType,
      tamano: archivo.tamano,
      fechaSubida: archivo.fechaSubida,
    };
  }
}
