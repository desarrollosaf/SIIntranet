import { FormatosService } from './formatos.service';
export declare class FormatosController {
    private readonly formatosService;
    constructor(formatosService: FormatosService);
    getStatus(): {
        module: string;
        status: string;
        database: string;
    };
}
