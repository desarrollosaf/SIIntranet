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
exports.FormatosController = void 0;
const common_1 = require("@nestjs/common");
const formatos_service_1 = require("./formatos.service");
let FormatosController = class FormatosController {
    formatosService;
    constructor(formatosService) {
        this.formatosService = formatosService;
    }
    getStatus() {
        return this.formatosService.getStatus();
    }
};
exports.FormatosController = FormatosController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FormatosController.prototype, "getStatus", null);
exports.FormatosController = FormatosController = __decorate([
    (0, common_1.Controller)('formatos'),
    __metadata("design:paramtypes", [formatos_service_1.FormatosService])
], FormatosController);
//# sourceMappingURL=formatos.controller.js.map