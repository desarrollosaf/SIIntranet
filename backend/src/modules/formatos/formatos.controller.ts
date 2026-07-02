import { Controller, Get } from '@nestjs/common';
import { FormatosService } from './formatos.service';

@Controller('formatos')
export class FormatosController {
  constructor(private readonly formatosService: FormatosService) {}

  @Get('status')
  getStatus() {
    return this.formatosService.getStatus();
  }
}
