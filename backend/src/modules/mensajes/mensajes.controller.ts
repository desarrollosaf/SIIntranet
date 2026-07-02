import { Controller, Get } from '@nestjs/common';
import { MensajesService } from './mensajes.service';

@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get('status')
  getStatus() {
    return this.mensajesService.getStatus();
  }
}
