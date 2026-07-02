import { Controller, Get } from '@nestjs/common';
import { RecordatoriosService } from './recordatorios.service';

@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly recordatoriosService: RecordatoriosService) {}

  @Get('status')
  getStatus() {
    return this.recordatoriosService.getStatus();
  }
}
