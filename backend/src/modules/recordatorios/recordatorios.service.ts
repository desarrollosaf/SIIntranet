import { Injectable, NotFoundException } from '@nestjs/common';
import { Recordatorio } from '../../common/interfaces/common.interfaces';
import { CreateRecordatorioDto } from './dto/create-recordatorio.dto';
import { UpdateRecordatorioDto } from './dto/update-recordatorio.dto';

@Injectable()
export class RecordatoriosService {
  private recordatorios: Recordatorio[] = [];
  private nextId = 1;

  getStatus() {
    return {
      module: 'recordatorios',
      status: 'ready',
      database: 'not-connected',
    };
  }

  findAll(): Recordatorio[] {
    return this.recordatorios.filter(r => r.estado !== 'Eliminado');
  }

  findOne(id: number): Recordatorio {
    const recordatorio = this.recordatorios.find(r => r.id === id);
    if (!recordatorio) {
      throw new NotFoundException(`Recordatorio con ID ${id} no encontrado`);
    }
    return recordatorio;
  }

  findByFecha(fecha: string): Recordatorio[] {
    return this.recordatorios.filter(
      r => r.fecha === fecha && r.estado !== 'Eliminado',
    );
  }

  create(createRecordatorioDto: CreateRecordatorioDto): Recordatorio {
    const nuevoRecordatorio: Recordatorio = {
      id: this.nextId++,
      titulo: createRecordatorioDto.titulo,
      descripcion: createRecordatorioDto.descripcion,
      fecha: createRecordatorioDto.fecha,
      hora: createRecordatorioDto.hora,
      tipo: 'recordatorio',
      estado: createRecordatorioDto.estado || 'Activo',
      creadoPor: createRecordatorioDto.creadoPor,
    };

    this.recordatorios.push(nuevoRecordatorio);
    return nuevoRecordatorio;
  }

  update(id: number, updateRecordatorioDto: UpdateRecordatorioDto): Recordatorio {
    const recordatorio = this.findOne(id);

    if (updateRecordatorioDto.titulo !== undefined) recordatorio.titulo = updateRecordatorioDto.titulo;
    if (updateRecordatorioDto.descripcion !== undefined) recordatorio.descripcion = updateRecordatorioDto.descripcion;
    if (updateRecordatorioDto.fecha !== undefined) recordatorio.fecha = updateRecordatorioDto.fecha;
    if (updateRecordatorioDto.hora !== undefined) recordatorio.hora = updateRecordatorioDto.hora;
    if (updateRecordatorioDto.estado !== undefined) recordatorio.estado = updateRecordatorioDto.estado;

    return recordatorio;
  }

  remove(id: number): Recordatorio {
    const recordatorio = this.findOne(id);
    recordatorio.estado = 'Eliminado';
    return recordatorio;
  }
}
