import { Injectable } from '@nestjs/common';

@Injectable()
export class ArchivosService {
  getStatus() {
    return {
      module: 'archivos',
      status: 'ready',
      database: 'not-connected',
    };
  }
}
