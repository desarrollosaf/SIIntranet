import { ArchivosService } from './archivos.service';
export declare class ArchivosController {
    private readonly archivosService;
    constructor(archivosService: ArchivosService);
    getStatus(): {
        module: string;
        status: string;
        database: string;
    };
}
