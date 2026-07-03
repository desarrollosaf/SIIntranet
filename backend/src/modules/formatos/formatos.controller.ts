import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { FormatosService } from './formatos.service';
import { CreateFormatoDto } from './dto/create-formato.dto';
import { UpdateFormatoDto } from './dto/update-formato.dto';

@Controller('formatos')
export class FormatosController {
  constructor(private readonly formatosService: FormatosService) {}

  @Get('status')
  getStatus() {
    return this.formatosService.getStatus();
  }

  @Get()
  findAll() {
    return this.formatosService.findAll();
  }

  @Get('categoria/:categoria')
  findByCategoria(@Param('categoria') categoria: string) {
    return this.formatosService.findByCategoria(categoria);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formatosService.findOne(id);
  }

  @Post()
  create(@Body() createFormatoDto: CreateFormatoDto) {
    return this.formatosService.create(createFormatoDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateFormatoDto: UpdateFormatoDto) {
    return this.formatosService.update(id, updateFormatoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.formatosService.remove(id);
  }
}
