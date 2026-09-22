import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Mensaje } from './models/mensaje.model';
import { DestinatarioMensaje } from './models/destinatario.model';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ArchivosService } from '../archivos/archivos.service';

@Injectable()
export class MensajesService {
  private readonly mensajes = new Map<string, Mensaje>();
  private readonly destinatarios = new Map<string, Map<string, DestinatarioMensaje>>();

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly archivosService: ArchivosService,
  ) {}

  crear(dto: CreateMensajeDto, actorId: string): Mensaje {
    let destinatarioActorEnOriginal: DestinatarioMensaje | undefined;

    if (dto.respuestaAId) {
      const mensajeOriginal = this.buscarMensajeInterno(dto.respuestaAId);
      destinatarioActorEnOriginal = this.destinatarioInterno(mensajeOriginal.id, actorId);

      if (!destinatarioActorEnOriginal) {
        throw new ForbiddenException('Solo un destinatario del mensaje original puede responder.');
      }

      if (mensajeOriginal.estado !== 'Enviado') {
        throw new ConflictException('El mensaje original ya no admite respuestas.');
      }

      if (!dto.destinatarioIds.includes(mensajeOriginal.remitenteId)) {
        throw new BadRequestException(
          'La respuesta debe incluir al remitente del mensaje original entre los destinatarios.',
        );
      }
    }

    for (const usuarioId of dto.destinatarioIds) {
      this.usuariosService.obtenerPorId(usuarioId);
    }

    const archivoIds = dto.archivoIds ?? [];
    for (const archivoId of archivoIds) {
      this.archivosService.obtenerPorId(archivoId, actorId);
    }

    const id = randomUUID();
    const mensaje: Mensaje = {
      id,
      remitenteId: actorId,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      archivoIds: [...archivoIds],
      fechaCreacion: new Date().toISOString(),
      estado: 'Enviado',
    };

    this.mensajes.set(id, mensaje);
    this.destinatarios.set(id, new Map());

    for (const usuarioId of dto.destinatarioIds) {
      this.destinatarios.get(id)!.set(usuarioId, {
        id: randomUUID(),
        mensajeId: id,
        usuarioId,
        estadoLectura: 'Nuevo',
        estadoRespuesta: 'Pendiente',
      });
    }

    if (destinatarioActorEnOriginal) {
      destinatarioActorEnOriginal.estadoLectura = 'Visto';
      destinatarioActorEnOriginal.estadoRespuesta = 'Respondido';
    }

    return this.copiarMensaje(mensaje);
  }

  obtenerRecibidos(actorId: string) {
    return [...this.mensajes.values()]
      .map((mensaje) => ({ mensaje, destinatario: this.destinatarioInterno(mensaje.id, actorId) }))
      .filter(
        (par): par is { destinatario: DestinatarioMensaje; mensaje: Mensaje } =>
          par.destinatario !== undefined && !par.mensaje.fechaCancelacion,
      )
      .map(({ mensaje, destinatario }) => this.aVistaRecibido(mensaje, destinatario));
  }

  obtenerEnviados(actorId: string) {
    return [...this.mensajes.values()]
      .filter((m) => m.remitenteId === actorId)
      .map((mensaje) => this.aVistaEnviado(mensaje));
  }

  obtenerDetalle(id: string, actorId: string) {
    const mensaje = this.buscarMensajeInterno(id);
    const esRemitente = mensaje.remitenteId === actorId;
    const destinatario = this.destinatarioInterno(id, actorId);

    if (!esRemitente && !destinatario) {
      throw new ForbiddenException('No tiene acceso a este mensaje.');
    }

    if (!esRemitente && mensaje.fechaCancelacion) {
      throw new ForbiddenException('No tiene acceso a este mensaje.');
    }

    if (esRemitente) {
      return this.aVistaEnviado(mensaje);
    }

    return this.aVistaRecibido(mensaje, destinatario!);
  }

  marcarVisto(id: string, actorId: string): DestinatarioMensaje {
    const mensaje = this.buscarMensajeInterno(id);
    const destinatario = this.destinatarioInterno(id, actorId);

    if (!destinatario) {
      throw new ForbiddenException('Solo un destinatario puede marcar este mensaje como visto.');
    }

    if (mensaje.estado !== 'Enviado') {
      throw new ConflictException('El mensaje ya no está disponible.');
    }

    destinatario.estadoLectura = 'Visto';
    return { ...destinatario };
  }

  actualizar(id: string, dto: UpdateMensajeDto, actorId: string): Mensaje {
    const mensaje = this.buscarMensajeInterno(id);

    if (mensaje.remitenteId !== actorId) {
      throw new ForbiddenException('Solo el remitente puede editar este mensaje.');
    }

    if (this.estaBloqueadoParaModificar(mensaje)) {
      throw new ConflictException('El mensaje ya no puede editarse.');
    }

    if (dto.archivoIds !== undefined) {
      for (const archivoId of dto.archivoIds) {
        this.archivosService.obtenerPorId(archivoId, actorId);
      }
    }

    if (dto.destinatarioIds !== undefined) {
      for (const usuarioId of dto.destinatarioIds) {
        this.usuariosService.obtenerPorId(usuarioId);
      }
    }

    if (dto.titulo !== undefined) {
      mensaje.titulo = dto.titulo;
    }

    if (dto.descripcion !== undefined) {
      mensaje.descripcion = dto.descripcion;
    }

    if (dto.archivoIds !== undefined) {
      mensaje.archivoIds = [...dto.archivoIds];
    }

    if (dto.destinatarioIds !== undefined) {
      this.sincronizarDestinatarios(id, dto.destinatarioIds);
    }

    return this.copiarMensaje(mensaje);
  }

  cancelar(id: string, actorId: string): Mensaje {
    const mensaje = this.buscarMensajeInterno(id);

    if (mensaje.remitenteId !== actorId) {
      throw new ForbiddenException('Solo el remitente puede cancelar este mensaje.');
    }

    if (this.estaBloqueadoParaModificar(mensaje)) {
      throw new ConflictException('El mensaje ya no puede cancelarse.');
    }

    mensaje.estado = 'Cancelado';
    mensaje.fechaCancelacion = new Date().toISOString();
    return this.copiarMensaje(mensaje);
  }

  eliminar(id: string, actorId: string): Mensaje {
    const mensaje = this.buscarMensajeInterno(id);

    if (mensaje.remitenteId !== actorId) {
      throw new ForbiddenException('Solo el remitente puede eliminar este mensaje.');
    }

    mensaje.estado = 'Eliminado';
    return this.copiarMensaje(mensaje);
  }

  async obtenerAdjuntoParaDescarga(mensajeId: string, archivoId: string, actorId: string) {
    const mensaje = this.buscarMensajeInterno(mensajeId);
    const esRemitente = mensaje.remitenteId === actorId;
    const destinatario = this.destinatarioInterno(mensajeId, actorId);

    if (!esRemitente && !destinatario) {
      throw new ForbiddenException('No tiene acceso a este mensaje.');
    }

    if (!esRemitente && mensaje.fechaCancelacion) {
      throw new ForbiddenException('No tiene acceso a este mensaje.');
    }

    if (mensaje.estado === 'Eliminado') {
      throw new NotFoundException('El adjunto ya no está disponible.');
    }

    if (!mensaje.archivoIds.includes(archivoId)) {
      throw new NotFoundException('El archivo no pertenece a este mensaje.');
    }

    return this.archivosService.obtenerParaUsoInterno(archivoId);
  }

  private copiarMensaje(mensaje: Mensaje): Mensaje {
    return {
      ...mensaje,
      archivoIds: [...mensaje.archivoIds],
    };
  }

  private buscarMensajeInterno(id: string): Mensaje {
    const mensaje = this.mensajes.get(id);

    if (!mensaje) {
      throw new NotFoundException(`Mensaje ${id} no encontrado`);
    }

    return mensaje;
  }

  private destinatarioInterno(
    mensajeId: string,
    usuarioId: string,
  ): DestinatarioMensaje | undefined {
    return this.destinatarios.get(mensajeId)?.get(usuarioId);
  }

  private destinatariosDeInterno(mensajeId: string): DestinatarioMensaje[] {
    return [...(this.destinatarios.get(mensajeId)?.values() ?? [])];
  }

  private estaBloqueadoParaModificar(mensaje: Mensaje): boolean {
    const hayVisto = this.destinatariosDeInterno(mensaje.id).some(
      (d) => d.estadoLectura !== 'Nuevo',
    );
    return mensaje.estado !== 'Enviado' || hayVisto;
  }

  private sincronizarDestinatarios(mensajeId: string, nuevosIds: string[]): void {
    const actuales = this.destinatarios.get(mensajeId)!;
    const nuevosSet = new Set(nuevosIds);

    for (const usuarioId of actuales.keys()) {
      if (!nuevosSet.has(usuarioId)) {
        actuales.delete(usuarioId);
      }
    }

    for (const usuarioId of nuevosIds) {
      if (!actuales.has(usuarioId)) {
        actuales.set(usuarioId, {
          id: randomUUID(),
          mensajeId,
          usuarioId,
          estadoLectura: 'Nuevo',
          estadoRespuesta: 'Pendiente',
        });
      }
    }
  }

  private aVistaRecibido(mensaje: Mensaje, destinatario: DestinatarioMensaje) {
    const contenidoDisponible = mensaje.estado !== 'Eliminado';
    const remitente = this.usuariosService.obtenerPorId(mensaje.remitenteId);

    const base = {
      id: mensaje.id,
      remitente: { id: remitente.id, nombre: remitente.nombre, usuario: remitente.usuario },
      fechaCreacion: mensaje.fechaCreacion,
      estado: mensaje.estado,
      contenidoDisponible,
      estadoLectura: destinatario.estadoLectura,
      estadoRespuesta: destinatario.estadoRespuesta,
    };

    if (!contenidoDisponible) {
      return base;
    }

    return {
      ...base,
      titulo: mensaje.titulo,
      descripcion: mensaje.descripcion,
      archivoIds: [...mensaje.archivoIds],
    };
  }

  private aVistaEnviado(mensaje: Mensaje) {
    const contenidoDisponible = mensaje.estado !== 'Eliminado';
    const destinatarios = this.destinatariosDeInterno(mensaje.id).map((d) => {
      const usuario = this.usuariosService.obtenerPorId(d.usuarioId);
      return {
        usuarioId: usuario.id,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        estadoLectura: d.estadoLectura,
        estadoRespuesta: d.estadoRespuesta,
      };
    });

    const base = {
      id: mensaje.id,
      fechaCreacion: mensaje.fechaCreacion,
      estado: mensaje.estado,
      contenidoDisponible,
      destinatarios,
    };

    if (!contenidoDisponible) {
      return base;
    }

    return {
      ...base,
      titulo: mensaje.titulo,
      descripcion: mensaje.descripcion,
      archivoIds: [...mensaje.archivoIds],
    };
  }
}
