import { UsuariosService } from './usuarios.service';
export declare class UsuariosController {
    private readonly usuariosService;
    constructor(usuariosService: UsuariosService);
    getStatus(): {
        module: string;
        status: string;
        database: string;
    };
}
