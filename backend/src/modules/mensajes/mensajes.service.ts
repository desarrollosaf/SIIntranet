import { Injectable, NotFoundException } from '@nestjs/common';
import { Mensaje } from '../../common/interfaces/common.interfaces';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';

@Injectable()
export class MensajesService {
  private mensajes: Mensaje[] = [];
  private nextId = 1;

  getStatus() {
    return {
      module: 'mensajes',
      status: 'ready',
      database: 'not-connected',
    };
  }

  findAll(): Mensaje[] {
    return this.mensajes.filter(m => m.estado !== 'Eliminado');
  }

  findRecibidos(): Mensaje[] {
    return this.mensajes.filter(m => m.tipoMensaje === 'recibido' && m.estado !== 'Eliminado');
  }

  findEnviados(): Mensaje[] {
    return this.mensajes.filter(m => m.tipoMensaje === 'enviado' && m.estado !== 'Eliminado');
  }

  findOne(id: number): Mensaje {
    const mensaje = this.mensajes.find(m => m.id === id);
    if (!mensaje) {
      throw new NotFoundException(`Mensaje con ID ${id} no encontrado`);
    }
    return mensaje;
  }

  create(createMensajeDto: CreateMensajeDto): Mensaje {
    const hoy = new Date();
    const fechaStr = createMensajeDto.fecha || hoy.toISOString().split('T')[0];
    const horaStr = createMensajeDto.hora || `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`;

    const nuevoMensaje: Mensaje = {
      id: this.nextId++,
      remitente: createMensajeDto.remitente,
      titulo: createMensajeDto.titulo,
      descripcion: createMensajeDto.descripcion,
      fecha: fechaStr,
      hora: horaStr,
      documento: createMensajeDto.documento || 'Sin adjunto',
      destinatarios: createMensajeDto.destinatarios,
      estado: createMensajeDto.estado || 'Enviando',
      tipoMensaje: createMensajeDto.tipoMensaje || 'enviado',
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
    };

    this.mensajes.push(nuevoMensaje);
    return nuevoMensaje;
  }

  update(id: number, updateMensajeDto: UpdateMensajeDto): Mensaje {
    const mensaje = this.findOne(id);

    if (updateMensajeDto.titulo !== undefined) mensaje.titulo = updateMensajeDto.titulo;
    if (updateMensajeDto.descripcion !== undefined) mensaje.descripcion = updateMensajeDto.descripcion;
    if (updateMensajeDto.destinatarios !== undefined) mensaje.destinatarios = updateMensajeDto.destinatarios;
    if (updateMensajeDto.documento !== undefined) mensaje.documento = updateMensajeDto.documento;
    if (updateMensajeDto.estado !== undefined) mensaje.estado = updateMensajeDto.estado;

    return mensaje;
  }

  remove(id: number): Mensaje {
    const mensaje = this.findOne(id);
    mensaje.estado = 'Eliminado';
    return mensaje;
  }
}
