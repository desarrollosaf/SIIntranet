import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateEstadoUsuarioDto } from './dto/update-estado-usuario.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @UseGuards(AuthGuard)
  @Get()
  listar() {
    return this.usuariosService.listar();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.usuariosService.obtenerPorId(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() datos: UpdateUsuarioDto) {
    return this.usuariosService.actualizar(id, datos);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() datos: UpdateEstadoUsuarioDto) {
    return this.usuariosService.cambiarEstado(id, datos.estado);
  }
}
