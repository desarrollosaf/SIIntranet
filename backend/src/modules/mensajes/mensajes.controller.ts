import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get('status')
  getStatus() {
    return this.mensajesService.getStatus();
  }

  @Get()
  findAll() {
    return this.mensajesService.findAll();
  }

  @Get('recibidos')
  findRecibidos() {
    return this.mensajesService.findRecibidos();
  }

  @Get('enviados')
  findEnviados() {
    return this.mensajesService.findEnviados();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mensajesService.findOne(id);
  }

  @Post()
  create(@Body() createMensajeDto: CreateMensajeDto) {
    return this.mensajesService.create(createMensajeDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMensajeDto: UpdateMensajeDto) {
    return this.mensajesService.update(id, updateMensajeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mensajesService.remove(id);
  }
}
