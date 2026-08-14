import { Body, Controller, Get, Param, Patch, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { sanearNombreParaDescarga } from '../archivos/archivos.service';

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @UseGuards(AuthGuard)
  @Get('recibidos')
  recibidos(@CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.obtenerRecibidos(actor.id);
  }

  @UseGuards(AuthGuard)
  @Get('enviados')
  enviados(@CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.obtenerEnviados(actor.id);
  }

  @UseGuards(AuthGuard)
  @Post()
  crear(@Body() dto: CreateMensajeDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.crear(dto, actor.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  detalle(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.obtenerDetalle(id, actor.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateMensajeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mensajesService.actualizar(id, dto, actor.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/visto')
  marcarVisto(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.marcarVisto(id, actor.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.cancelar(id, actor.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/eliminar')
  eliminar(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.mensajesService.eliminar(id, actor.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/adjuntos/:archivoId/descarga')
  async descargarAdjunto(
    @Param('id') id: string,
    @Param('archivoId') archivoId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { archivo, rutaFisica } = await this.mensajesService.obtenerAdjuntoParaDescarga(
      id,
      archivoId,
      actor.id,
    );

    res.attachment(sanearNombreParaDescarga(archivo.nombreOriginal));
    res.setHeader('Content-Type', archivo.mimeType);

    return new StreamableFile(createReadStream(rutaFisica));
  }
}
