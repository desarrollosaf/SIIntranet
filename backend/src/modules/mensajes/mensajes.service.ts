import { Injectable } from '@nestjs/common';

@Injectable()
export class MensajesService {
  getStatus() {
    return {
      module: 'mensajes',
      status: 'ready',
      database: 'not-connected',
    };
  }
}
