import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getStatus(): {
        module: string;
        status: string;
        database: string;
    };
}
