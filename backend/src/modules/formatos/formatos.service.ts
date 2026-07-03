import { Injectable, NotFoundException } from '@nestjs/common';
import { Formato } from '../../common/interfaces/common.interfaces';
import { CreateFormatoDto } from './dto/create-formato.dto';
import { UpdateFormatoDto } from './dto/update-formato.dto';

@Injectable()
export class FormatosService {
  private formatos: Formato[] = [];
  private nextId = 1;

  getStatus() {
    return {
      module: 'formatos',
      status: 'ready',
      database: 'not-connected',
    };
  }

  findAll(): Formato[] {
    return this.formatos.filter(f => f.estado === 'Activo');
  }

  findOne(id: number): Formato {
    const formato = this.formatos.find(f => f.id === id);
    if (!formato) {
      throw new NotFoundException(`Formato con ID ${id} no encontrado`);
    }
    return formato;
  }

  findByCategoria(categoria: string): Formato[] {
    return this.formatos.filter(
      f => f.categoria.toLowerCase() === categoria.toLowerCase() && f.estado === 'Activo',
    );
  }

  create(createFormatoDto: CreateFormatoDto): Formato {
    const hoy = new Date();
    const fechaStr = hoy.toISOString().split('T')[0];

    const nuevoFormato: Formato = {
      id: this.nextId++,
      nombre: createFormatoDto.nombre,
      descripcion: createFormatoDto.descripcion,
      categoria: createFormatoDto.categoria,
      archivo: createFormatoDto.archivo,
      tipoArchivo: createFormatoDto.tipoArchivo,
      fechaCreacion: fechaStr,
      estado: createFormatoDto.estado || 'Activo',
    };

    this.formatos.push(nuevoFormato);
    return nuevoFormato;
  }

  update(id: number, updateFormatoDto: UpdateFormatoDto): Formato {
    const formato = this.findOne(id);

    if (updateFormatoDto.nombre !== undefined) formato.nombre = updateFormatoDto.nombre;
    if (updateFormatoDto.descripcion !== undefined) formato.descripcion = updateFormatoDto.descripcion;
    if (updateFormatoDto.categoria !== undefined) formato.categoria = updateFormatoDto.categoria;
    if (updateFormatoDto.archivo !== undefined) formato.archivo = updateFormatoDto.archivo;
    if (updateFormatoDto.tipoArchivo !== undefined) formato.tipoArchivo = updateFormatoDto.tipoArchivo;
    if (updateFormatoDto.estado !== undefined) formato.estado = updateFormatoDto.estado;

    return formato;
  }

  remove(id: number): Formato {
    const formato = this.findOne(id);
    formato.estado = 'Inactivo';
    return formato;
  }
}
