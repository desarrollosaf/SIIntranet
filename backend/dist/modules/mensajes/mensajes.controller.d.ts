import { MensajesService } from './mensajes.service';
export declare class MensajesController {
    private readonly mensajesService;
    constructor(mensajesService: MensajesService);
    getStatus(): {
        module: string;
        status: string;
        database: string;
    };
}
