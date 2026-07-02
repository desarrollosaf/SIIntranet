"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchivosController = void 0;
const common_1 = require("@nestjs/common");
const archivos_service_1 = require("./archivos.service");
let ArchivosController = class ArchivosController {
    archivosService;
    constructor(archivosService) {
        this.archivosService = archivosService;
    }
    getStatus() {
        return this.archivosService.getStatus();
    }
};
exports.ArchivosController = ArchivosController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ArchivosController.prototype, "getStatus", null);
exports.ArchivosController = ArchivosController = __decorate([
    (0, common_1.Controller)('archivos'),
    __metadata("design:paramtypes", [archivos_service_1.ArchivosService])
], ArchivosController);
//# sourceMappingURL=archivos.controller.js.map