import { Body, Controller, Get, Param, Patch, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { FormatosService } from './formatos.service';
import { CreateFormatoDto } from './dto/create-formato.dto';
import { UpdateFormatoDto } from './dto/update-formato.dto';
import { UpdateEstadoFormatoDto } from './dto/update-estado-formato.dto';
import { sanearNombreParaDescarga } from '../archivos/archivos.service';

@Controller('formatos')
export class FormatosController {
  constructor(private readonly formatosService: FormatosService) {}

  @UseGuards(AuthGuard)
  @Get()
  listar() {
    return this.formatosService.listar();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.formatosService.obtenerPorId(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/descarga')
  async descargar(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { archivo, rutaFisica } = await this.formatosService.obtenerParaDescarga(id);

    res.attachment(sanearNombreParaDescarga(archivo.nombreOriginal));
    res.setHeader('Content-Type', archivo.mimeType);

    return new StreamableFile(createReadStream(rutaFisica));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  @Post()
  crear(@Body() dto: CreateFormatoDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.formatosService.crear(dto, actor.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateFormatoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.formatosService.actualizar(id, dto, actor.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: UpdateEstadoFormatoDto) {
    return this.formatosService.cambiarEstado(id, dto.estado);
  }
}
