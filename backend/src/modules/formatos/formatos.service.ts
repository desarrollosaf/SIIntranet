import { Injectable } from '@nestjs/common';

@Injectable()
export class FormatosService {
  getStatus() {
    return {
      module: 'formatos',
      status: 'ready',
      database: 'not-connected',
    };
  }
}
