import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EstadoFormato, Formato } from './models/formato.model';
import { CreateFormatoDto } from './dto/create-formato.dto';
import { UpdateFormatoDto } from './dto/update-formato.dto';
import { ArchivosService } from '../archivos/archivos.service';
import type { Archivo } from '../archivos/models/archivo.model';

interface ArchivoPublico {
  id: string;
  nombreOriginal: string;
  mimeType: string;
  tamano: number;
  fechaSubida: string;
}

/**
 * Forma expuesta por HTTP. Compuesta al vuelo a partir de Formato + Archivo
 * — nunca persistida así (ver Formato). NO incluye archivo.nombreAlmacenado
 * ni archivo.subidoPor: son detalles internos de Archivos.
 */
export interface FormatoPublico {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  fechaCreacion: string;
  estado: EstadoFormato;
  archivo: ArchivoPublico;
}

@Injectable()
export class FormatosService {
  private readonly formatos = new Map<string, Formato>();

  constructor(private readonly archivosService: ArchivosService) {}

  async crear(dto: CreateFormatoDto, actorId: string): Promise<FormatoPublico> {
    // Todo lo que puede fallar (uploader-only + disponibilidad física) se
    // resuelve ANTES de tocar el Map — si cualquiera de los dos pasos
    // lanza, ningún Formato queda registrado.
    this.archivosService.obtenerPorId(dto.archivoId, actorId);
    const { archivo } = await this.archivosService.obtenerParaUsoInterno(dto.archivoId);

    const formato: Formato = {
      id: randomUUID(),
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      categoria: dto.categoria,
      archivoId: dto.archivoId,
      fechaCreacion: new Date().toISOString(),
      estado: 'Activo',
    };

    this.formatos.set(formato.id, formato);
    return this.aRespuestaPublica(formato, archivo);
  }

  async listar(): Promise<FormatoPublico[]> {
    const activos = [...this.formatos.values()].filter((f) => f.estado === 'Activo');

    return Promise.all(
      activos.map(async (formato) => {
        const { archivo } = await this.archivosService.obtenerParaUsoInterno(formato.archivoId);
        return this.aRespuestaPublica(formato, archivo);
      }),
    );
  }

  async obtenerPorId(id: string): Promise<FormatoPublico> {
    const formato = this.buscarActivoInterno(id);
    const { archivo } = await this.archivosService.obtenerParaUsoInterno(formato.archivoId);
    return this.aRespuestaPublica(formato, archivo);
  }

  async actualizar(id: string, dto: UpdateFormatoDto, actorId: string): Promise<FormatoPublico> {
    const formato = this.buscarInterno(id);
    const archivoIdFinal = dto.archivoId ?? formato.archivoId;

    // Validar TODO lo externo (uploader-only del nuevo archivo, si se
    // propone, y disponibilidad física del que quedará vigente) ANTES de
    // mutar cualquier campo — así un archivo ajeno o físicamente no
    // disponible no deja el Formato a medio actualizar.
    if (dto.archivoId !== undefined) {
      this.archivosService.obtenerPorId(dto.archivoId, actorId);
    }

    const { archivo } = await this.archivosService.obtenerParaUsoInterno(archivoIdFinal);

    if (dto.nombre !== undefined) {
      formato.nombre = dto.nombre;
    }

    if (dto.descripcion !== undefined) {
      formato.descripcion = dto.descripcion;
    }

    if (dto.categoria !== undefined) {
      formato.categoria = dto.categoria;
    }

    if (dto.archivoId !== undefined) {
      formato.archivoId = dto.archivoId;
    }

    return this.aRespuestaPublica(formato, archivo);
  }

  async cambiarEstado(id: string, estado: EstadoFormato): Promise<FormatoPublico> {
    const formato = this.buscarInterno(id);
    const { archivo } = await this.archivosService.obtenerParaUsoInterno(formato.archivoId);

    formato.estado = estado;
    return this.aRespuestaPublica(formato, archivo);
  }

  async obtenerParaDescarga(id: string): Promise<{ archivo: Archivo; rutaFisica: string }> {
    const formato = this.buscarActivoInterno(id);
    return this.archivosService.obtenerParaUsoInterno(formato.archivoId);
  }

  private buscarInterno(id: string): Formato {
    const formato = this.formatos.get(id);

    if (!formato) {
      throw new NotFoundException(`Formato ${id} no encontrado`);
    }

    return formato;
  }

  /**
   * Lectura pública (13B): un Formato Inactivo se trata como inexistente
   * para cualquier consumidor de solo lectura, incluso Administrador — no
   * hay todavía un listado/vista administrativa de inactivos (§10/13A).
   */
  private buscarActivoInterno(id: string): Formato {
    const formato = this.buscarInterno(id);

    if (formato.estado !== 'Activo') {
      throw new NotFoundException(`Formato ${id} no encontrado`);
    }

    return formato;
  }

  /**
   * Proyección pura, sin I/O: recibe el Archivo ya resuelto por el llamador
   * (antes de cualquier mutación) para que ninguna operación asíncrona
   * pueda fallar después de que el Map ya haya sido modificado.
   */
  private aRespuestaPublica(formato: Formato, archivo: Archivo): FormatoPublico {
    return {
      id: formato.id,
      nombre: formato.nombre,
      descripcion: formato.descripcion,
      categoria: formato.categoria,
      fechaCreacion: formato.fechaCreacion,
      estado: formato.estado,
      archivo: this.aArchivoPublico(archivo),
    };
  }

  private aArchivoPublico(archivo: Archivo): ArchivoPublico {
    return {
      id: archivo.id,
      nombreOriginal: archivo.nombreOriginal,
      mimeType: archivo.mimeType,
      tamano: archivo.tamano,
      fechaSubida: archivo.fechaSubida,
    };
  }
}
