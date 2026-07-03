import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RecordatoriosService } from './recordatorios.service';
import { CreateRecordatorioDto } from './dto/create-recordatorio.dto';
import { UpdateRecordatorioDto } from './dto/update-recordatorio.dto';

@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly recordatoriosService: RecordatoriosService) {}

  @Get('status')
  getStatus() {
    return this.recordatoriosService.getStatus();
  }

  @Get()
  findAll() {
    return this.recordatoriosService.findAll();
  }

  @Get('fecha/:fecha')
  findByFecha(@Param('fecha') fecha: string) {
    return this.recordatoriosService.findByFecha(fecha);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recordatoriosService.findOne(id);
  }

  @Post()
  create(@Body() createRecordatorioDto: CreateRecordatorioDto) {
    return this.recordatoriosService.create(createRecordatorioDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRecordatorioDto: UpdateRecordatorioDto) {
    return this.recordatoriosService.update(id, updateRecordatorioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recordatoriosService.remove(id);
  }
}
