import { Injectable } from '@nestjs/common';

@Injectable()
export class RecordatoriosService {
  getStatus() {
    return {
      module: 'recordatorios',
      status: 'ready',
      database: 'not-connected',
    };
  }
}
