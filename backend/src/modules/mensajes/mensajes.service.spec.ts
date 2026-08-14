import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MensajesService } from './mensajes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ArchivosService } from '../archivos/archivos.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';

describe('MensajesService', () => {
  let service: MensajesService;
  let usuariosService: UsuariosService;
  let archivosService: ArchivosService;
  let tempDir: string;

  const REMITENTE = 'dev-usuario-1';
  const DESTINATARIO_2 = 'dev-usuario-2';
  const DESTINATARIO_3 = 'dev-usuario-3';

  function dto(overrides: Partial<CreateMensajeDto> = {}): CreateMensajeDto {
    return {
      titulo: 'Asunto',
      descripcion: 'Contenido del mensaje',
      destinatarioIds: [DESTINATARIO_2],
      ...overrides,
    } as CreateMensajeDto;
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mensajes-test-'));
    usuariosService = new UsuariosService();
    archivosService = new ArchivosService(tempDir);
    service = new MensajesService(usuariosService, archivosService);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('crear', () => {
    it('crea un mensaje con el remitente derivado del actor, no del body', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      expect(mensaje.remitenteId).toBe(REMITENTE);
      expect(mensaje.estado).toBe('Enviado');
      expect(mensaje.titulo).toBe('Asunto');
    });

    it('acepta múltiples destinatarios', () => {
      const mensaje = service.crear(dto({ destinatarioIds: [DESTINATARIO_2, DESTINATARIO_3] }), REMITENTE);

      const recibidosDos = service.obtenerRecibidos(DESTINATARIO_2);
      const recibidosTres = service.obtenerRecibidos(DESTINATARIO_3);

      expect(recibidosDos.some((m) => m.id === mensaje.id)).toBe(true);
      expect(recibidosTres.some((m) => m.id === mensaje.id)).toBe(true);
    });

    it('rechaza un destinatario inexistente', () => {
      expect(() => service.crear(dto({ destinatarioIds: ['no-existe'] }), REMITENTE)).toThrow(
        NotFoundException,
      );
    });

    it('acepta un archivo propio del remitente', async () => {
      const archivo = await archivosService.guardar(
        {
          fieldname: 'archivo',
          originalname: 'documento.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\n%%EOF'),
          size: 10,
          stream: undefined as never,
          destination: '',
          filename: '',
          path: '',
        },
        REMITENTE,
      );

      const mensaje = service.crear(dto({ archivoIds: [archivo.id] }), REMITENTE);

      expect(mensaje.archivoIds).toEqual([archivo.id]);
    });

    it('rechaza un archivo ajeno', async () => {
      const archivoAjeno = await archivosService.guardar(
        {
          fieldname: 'archivo',
          originalname: 'documento.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\n%%EOF'),
          size: 10,
          stream: undefined as never,
          destination: '',
          filename: '',
          path: '',
        },
        DESTINATARIO_2,
      );

      expect(() => service.crear(dto({ archivoIds: [archivoAjeno.id] }), REMITENTE)).toThrow(
        ForbiddenException,
      );
    });

    it('devuelve copias defensivas', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      mensaje.titulo = 'Mutado';

      const detalle = service.obtenerDetalle(mensaje.id, REMITENTE) as any;
      expect(detalle.titulo).toBe('Asunto');
    });

    it('mutar archivoIds del objeto devuelto no afecta el almacenamiento interno', async () => {
      const archivo = await archivosService.guardar(
        {
          fieldname: 'archivo',
          originalname: 'documento.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\n%%EOF'),
          size: 10,
          stream: undefined as never,
          destination: '',
          filename: '',
          path: '',
        },
        REMITENTE,
      );

      const mensaje = service.crear(dto({ archivoIds: [archivo.id] }), REMITENTE);
      mensaje.archivoIds.push('id-intruso');

      const detalle = service.obtenerDetalle(mensaje.id, REMITENTE) as any;
      expect(detalle.archivoIds).toEqual([archivo.id]);
    });
  });

  describe('recibidos / enviados / detalle', () => {
    it('recibidos solo incluye mensajes donde el actor es destinatario', () => {
      service.crear(dto({ destinatarioIds: [DESTINATARIO_2] }), REMITENTE);

      expect(service.obtenerRecibidos(DESTINATARIO_3)).toHaveLength(0);
      expect(service.obtenerRecibidos(DESTINATARIO_2)).toHaveLength(1);
    });

    it('enviados solo incluye mensajes del remitente', () => {
      service.crear(dto(), REMITENTE);

      expect(service.obtenerEnviados(DESTINATARIO_2)).toHaveLength(0);
      expect(service.obtenerEnviados(REMITENTE)).toHaveLength(1);
    });

    it('un tercero no autorizado recibe ForbiddenException en detalle', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      expect(() => service.obtenerDetalle(mensaje.id, DESTINATARIO_3)).toThrow(ForbiddenException);
    });

    it('un mensaje inexistente lanza NotFoundException', () => {
      expect(() => service.obtenerDetalle('no-existe', REMITENTE)).toThrow(NotFoundException);
    });
  });

  describe('visto', () => {
    it('GET detalle no muta estadoLectura', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      service.obtenerDetalle(mensaje.id, DESTINATARIO_2);

      const recibido = service.obtenerRecibidos(DESTINATARIO_2)[0] as any;
      expect(recibido.estadoLectura).toBe('Nuevo');
    });

    it('PATCH visto es idempotente', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      service.marcarVisto(mensaje.id, DESTINATARIO_2);
      service.marcarVisto(mensaje.id, DESTINATARIO_2);

      const recibido = service.obtenerRecibidos(DESTINATARIO_2)[0] as any;
      expect(recibido.estadoLectura).toBe('Visto');
    });

    it('visto es independiente por destinatario', () => {
      const mensaje = service.crear(dto({ destinatarioIds: [DESTINATARIO_2, DESTINATARIO_3] }), REMITENTE);

      service.marcarVisto(mensaje.id, DESTINATARIO_2);

      const vistoDos = service.obtenerRecibidos(DESTINATARIO_2)[0] as any;
      const vistoTres = service.obtenerRecibidos(DESTINATARIO_3)[0] as any;

      expect(vistoDos.estadoLectura).toBe('Visto');
      expect(vistoTres.estadoLectura).toBe('Nuevo');
    });

    it('el remitente no puede marcar visto si no es también destinatario', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      expect(() => service.marcarVisto(mensaje.id, REMITENTE)).toThrow(ForbiddenException);
    });

    it('un mensaje Cancelado ya no admite marcar visto', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      service.cancelar(mensaje.id, REMITENTE);

      expect(() => service.marcarVisto(mensaje.id, DESTINATARIO_2)).toThrow(ConflictException);
    });

    it('un tercero no autorizado recibe ForbiddenException incluso sobre un mensaje Cancelado (precedencia de autorización)', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      service.cancelar(mensaje.id, REMITENTE);

      expect(() => service.marcarVisto(mensaje.id, DESTINATARIO_3)).toThrow(ForbiddenException);
    });

    it('un mensaje Eliminado ya no admite marcar visto', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      service.eliminar(mensaje.id, REMITENTE);

      expect(() => service.marcarVisto(mensaje.id, DESTINATARIO_2)).toThrow(ConflictException);
    });
  });

  describe('editar', () => {
    it('permite editar antes de cualquier vista', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      const actualizado = service.actualizar(mensaje.id, { titulo: 'Nuevo título' }, REMITENTE);

      expect(actualizado.titulo).toBe('Nuevo título');
    });

    it('rechaza editar después de cualquier Visto con ConflictException', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      service.marcarVisto(mensaje.id, DESTINATARIO_2);

      expect(() => service.actualizar(mensaje.id, { titulo: 'X' }, REMITENTE)).toThrow(
        ConflictException,
      );
    });

    it('solo el remitente puede editar', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      expect(() => service.actualizar(mensaje.id, { titulo: 'X' }, DESTINATARIO_2)).toThrow(
        ForbiddenException,
      );
    });

    it('sincroniza destinatarios: mantiene, agrega y retira', () => {
      const mensaje = service.crear(dto({ destinatarioIds: [DESTINATARIO_2, DESTINATARIO_3] }), REMITENTE);

      service.actualizar(mensaje.id, { destinatarioIds: [DESTINATARIO_2, REMITENTE] }, REMITENTE);

      expect(service.obtenerRecibidos(DESTINATARIO_3)).toHaveLength(0);
      expect(service.obtenerRecibidos(DESTINATARIO_2)).toHaveLength(1);
      expect(service.obtenerRecibidos(REMITENTE)).toHaveLength(1);
    });

    it('un destinatario inexistente junto a un campo válido no aplica ningún cambio', () => {
      const mensaje = service.crear(dto({ destinatarioIds: [DESTINATARIO_2, DESTINATARIO_3] }), REMITENTE);

      expect(() =>
        service.actualizar(
          mensaje.id,
          { titulo: 'Nuevo título que no debe aplicarse', destinatarioIds: ['no-existe'] },
          REMITENTE,
        ),
      ).toThrow(NotFoundException);

      const detalle = service.obtenerDetalle(mensaje.id, REMITENTE) as any;
      expect(detalle.titulo).toBe('Asunto');
      expect(service.obtenerRecibidos(DESTINATARIO_2)).toHaveLength(1);
      expect(service.obtenerRecibidos(DESTINATARIO_3)).toHaveLength(1);
    });

    it('un archivoId inválido junto a un campo válido no aplica ningún cambio', async () => {
      const archivoAjeno = await archivosService.guardar(
        {
          fieldname: 'archivo',
          originalname: 'documento.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\n%%EOF'),
          size: 10,
          stream: undefined as never,
          destination: '',
          filename: '',
          path: '',
        },
        DESTINATARIO_2,
      );
      const mensaje = service.crear(dto(), REMITENTE);

      expect(() =>
        service.actualizar(
          mensaje.id,
          { titulo: 'No debe aplicarse', archivoIds: [archivoAjeno.id] },
          REMITENTE,
        ),
      ).toThrow(ForbiddenException);

      const detalle = service.obtenerDetalle(mensaje.id, REMITENTE) as any;
      expect(detalle.titulo).toBe('Asunto');
      expect(detalle.archivoIds).toEqual([]);
    });
  });

  describe('cancelar', () => {
    it('cancela antes de cualquier vista', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      const cancelado = service.cancelar(mensaje.id, REMITENTE);

      expect(cancelado.estado).toBe('Cancelado');
      expect(service.obtenerRecibidos(DESTINATARIO_2)).toHaveLength(0);
      expect(service.obtenerEnviados(REMITENTE)[0].estado).toBe('Cancelado');
    });

    it('rechaza cancelar después de Visto con ConflictException', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      service.marcarVisto(mensaje.id, DESTINATARIO_2);

      expect(() => service.cancelar(mensaje.id, REMITENTE)).toThrow(ConflictException);
    });
  });

  describe('eliminar', () => {
    it('elimina produce una representación sin contenido para el destinatario', () => {
      const mensaje = service.crear(dto(), REMITENTE);

      service.eliminar(mensaje.id, REMITENTE);

      const recibido = service.obtenerRecibidos(DESTINATARIO_2)[0] as any;
      expect(recibido.estado).toBe('Eliminado');
      expect(recibido.contenidoDisponible).toBe(false);
      expect(recibido.titulo).toBeUndefined();
      expect(recibido.descripcion).toBeUndefined();
      expect(recibido.archivoIds).toBeUndefined();
    });

    it('un mensaje Eliminado sigue apareciendo (tombstone), a diferencia de Cancelado', () => {
      const mensaje = service.crear(dto(), REMITENTE);
      service.eliminar(mensaje.id, REMITENTE);

      expect(service.obtenerRecibidos(DESTINATARIO_2)).toHaveLength(1);
    });
  });

  describe('responder', () => {
    it('una respuesta válida crea el mensaje y marca Respondido solo al actor', () => {
      const original = service.crear(dto({ destinatarioIds: [DESTINATARIO_2, DESTINATARIO_3] }), REMITENTE);

      service.crear(
        dto({
          titulo: 'Re: Asunto',
          destinatarioIds: [REMITENTE],
          respuestaAId: original.id,
        }),
        DESTINATARIO_2,
      );

      const vistaDos = service.obtenerDetalle(original.id, DESTINATARIO_2) as any;
      const vistaTres = service.obtenerDetalle(original.id, DESTINATARIO_3) as any;

      expect(vistaDos.estadoRespuesta).toBe('Respondido');
      expect(vistaTres.estadoRespuesta).toBe('Pendiente');
    });

    it('rechaza responder si el actor no es destinatario del original', () => {
      const original = service.crear(dto({ destinatarioIds: [DESTINATARIO_2] }), REMITENTE);

      expect(() =>
        service.crear(
          dto({ destinatarioIds: [REMITENTE], respuestaAId: original.id }),
          DESTINATARIO_3,
        ),
      ).toThrow(ForbiddenException);
    });

    it('rechaza responder si la respuesta no incluye al remitente original', () => {
      const original = service.crear(dto({ destinatarioIds: [DESTINATARIO_2] }), REMITENTE);

      expect(() =>
        service.crear(
          dto({ destinatarioIds: [DESTINATARIO_3], respuestaAId: original.id }),
          DESTINATARIO_2,
        ),
      ).toThrow(BadRequestException);
    });

    it('rechaza responder a un mensaje ya cancelado', () => {
      const original = service.crear(dto({ destinatarioIds: [DESTINATARIO_2] }), REMITENTE);
      service.cancelar(original.id, REMITENTE);

      expect(() =>
        service.crear(
          dto({ destinatarioIds: [REMITENTE], respuestaAId: original.id }),
          DESTINATARIO_2,
        ),
      ).toThrow(ConflictException);
    });

    it('si la creación de la respuesta falla, el original NO queda marcado como Respondido', () => {
      const original = service.crear(dto({ destinatarioIds: [DESTINATARIO_2] }), REMITENTE);

      expect(() =>
        service.crear(
          dto({ destinatarioIds: [REMITENTE, 'no-existe'], respuestaAId: original.id }),
          DESTINATARIO_2,
        ),
      ).toThrow(NotFoundException);

      const vista = service.obtenerDetalle(original.id, DESTINATARIO_2) as any;
      expect(vista.estadoRespuesta).toBe('Pendiente');
    });
  });

  describe('adjuntos vía Mensajería', () => {
    async function crearArchivo(actorId: string) {
      return archivosService.guardar(
        {
          fieldname: 'archivo',
          originalname: 'documento.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\n%%EOF'),
          size: 10,
          stream: undefined as never,
          destination: '',
          filename: '',
          path: '',
        },
        actorId,
      );
    }

    it('el destinatario puede descargar un adjunto del mensaje aunque no lo haya subido', async () => {
      const archivo = await crearArchivo(REMITENTE);
      const mensaje = service.crear(dto({ archivoIds: [archivo.id] }), REMITENTE);

      const resultado = await service.obtenerAdjuntoParaDescarga(mensaje.id, archivo.id, DESTINATARIO_2);

      expect(resultado.archivo.id).toBe(archivo.id);
    });

    it('un tercero no autorizado recibe ForbiddenException', async () => {
      const archivo = await crearArchivo(REMITENTE);
      const mensaje = service.crear(dto({ archivoIds: [archivo.id] }), REMITENTE);

      await expect(
        service.obtenerAdjuntoParaDescarga(mensaje.id, archivo.id, DESTINATARIO_3),
      ).rejects.toThrow(ForbiddenException);
    });

    it('un archivoId no asociado al mensaje lanza NotFoundException', async () => {
      const archivo = await crearArchivo(REMITENTE);
      const otroArchivo = await crearArchivo(REMITENTE);
      const mensaje = service.crear(dto({ archivoIds: [archivo.id] }), REMITENTE);

      await expect(
        service.obtenerAdjuntoParaDescarga(mensaje.id, otroArchivo.id, DESTINATARIO_2),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
