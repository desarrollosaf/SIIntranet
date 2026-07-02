import { RecordatoriosService } from './recordatorios.service';
export declare class RecordatoriosController {
    private readonly recordatoriosService;
    constructor(recordatoriosService: RecordatoriosService);
    getStatus(): {
        module: string;
        status: string;
        database: string;
    };
}
