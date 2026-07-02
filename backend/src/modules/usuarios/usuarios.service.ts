import { Injectable } from '@nestjs/common';

@Injectable()
export class UsuariosService {
  getStatus() {
    return {
      module: 'usuarios',
      status: 'ready',
      database: 'not-connected',
    };
  }
}
