import {
  BadRequestException,
  FileTypeValidator,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Archivo } from './models/archivo.model';

interface TipoPermitido {
  /** Lo que debe detectar FileTypeValidator por contenido (magic number). */
  mimeContenido: RegExp;
  /** Lo que el cliente debe declarar en el Content-Type de la parte multipart. */
  mimeDeclarado: RegExp;
  /** Lo que se guarda en Archivo.mimeType — nunca file.mimetype tal cual. */
  mimeCanonico: string;
}

/**
 * Whitelist de D17 (tipos permitidos). Un archivo solo se acepta si las TRES
 * señales coinciden simultáneamente: extensión permitida, MIME declarado por
 * el cliente compatible con esa extensión, Y contenido real (magic number)
 * compatible. No se confía en `file.mimetype` como fuente final — es una
 * exigencia más, no la validación en sí.
 *
 * Los formatos binarios legacy de Office (.doc/.xls/.ppt) comparten el mismo
 * contenedor "Compound File Binary" (OLE) — file-type solo puede confirmar
 * que el contenido es un CFB real, no distinguir Word/Excel/PowerPoint entre
 * sí (verificado empíricamente: los tres resuelven a `application/x-cfb`).
 * Por eso, para estos tres, la señal que sí distingue el tipo exacto es el
 * MIME declarado (`mimeDeclarado`) combinado con la extensión — el contenido
 * solo confirma que es un CFB genuino, no un ejecutable/script disfrazado.
 */
const TIPOS_PERMITIDOS: Record<string, TipoPermitido> = {
  '.pdf': {
    mimeContenido: /^application\/pdf$/,
    mimeDeclarado: /^application\/pdf$/,
    mimeCanonico: 'application/pdf',
  },
  '.doc': {
    mimeContenido: /^application\/x-cfb$/,
    mimeDeclarado: /^application\/msword$/,
    mimeCanonico: 'application/msword',
  },
  '.xls': {
    mimeContenido: /^application\/x-cfb$/,
    mimeDeclarado: /^application\/vnd\.ms-excel$/,
    mimeCanonico: 'application/vnd.ms-excel',
  },
  '.ppt': {
    mimeContenido: /^application\/x-cfb$/,
    mimeDeclarado: /^application\/vnd\.ms-powerpoint$/,
    mimeCanonico: 'application/vnd.ms-powerpoint',
  },
  '.docx': {
    mimeContenido: /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
    mimeDeclarado: /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
    mimeCanonico: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  '.xlsx': {
    mimeContenido: /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/,
    mimeDeclarado: /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/,
    mimeCanonico: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  '.pptx': {
    mimeContenido: /^application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation$/,
    mimeDeclarado: /^application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation$/,
    mimeCanonico: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  '.jpg': { mimeContenido: /^image\/jpeg$/, mimeDeclarado: /^image\/jpeg$/, mimeCanonico: 'image/jpeg' },
  '.jpeg': { mimeContenido: /^image\/jpeg$/, mimeDeclarado: /^image\/jpeg$/, mimeCanonico: 'image/jpeg' },
  '.png': { mimeContenido: /^image\/png$/, mimeDeclarado: /^image\/png$/, mimeCanonico: 'image/png' },
};

export function sanearNombreParaDescarga(nombreOriginal: string): string {
  const saneado = nombreOriginal
    .replace(/[\\/]/g, '_')
    .replace(/[\r\n]/g, '')
    .replace(/[\x00-\x1f]/g, '')
    .trim();

  return saneado || 'archivo';
}

@Injectable()
export class ArchivosService {
  private readonly archivos = new Map<string, Archivo>();
  private readonly storageDir: string;

  constructor(@Optional() storageDir: string = join(process.cwd(), 'storage', 'archivos')) {
    this.storageDir = storageDir;
  }

  async guardar(file: Express.Multer.File, actorId: string): Promise<Archivo> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.');
    }

    const extension = extname(file.originalname).toLowerCase();
    const tipo = TIPOS_PERMITIDOS[extension];

    if (!tipo) {
      throw new BadRequestException('Tipo de archivo no permitido.');
    }

    if (!tipo.mimeDeclarado.test(file.mimetype)) {
      throw new BadRequestException('El MIME declarado no corresponde a la extensión del archivo.');
    }

    const validador = new FileTypeValidator({ fileType: tipo.mimeContenido });
    const contenidoValido = await validador.isValid(file);

    if (!contenidoValido) {
      throw new BadRequestException('El contenido del archivo no coincide con el tipo declarado.');
    }

    const id = randomUUID();
    // Nombre interno independiente del input del cliente: nunca se construye
    // una ruta a partir de file.originalname.
    const nombreAlmacenado = `${randomUUID()}${extension}`;

    await mkdir(this.storageDir, { recursive: true });
    await writeFile(join(this.storageDir, nombreAlmacenado), file.buffer);

    const archivo: Archivo = {
      id,
      nombreOriginal: file.originalname,
      nombreAlmacenado,
      // MIME canónico de nuestra whitelist, NUNCA file.mimetype tal cual —
      // ya validado arriba, pero el valor guardado es el nuestro, no el que
      // declaró el cliente.
      mimeType: tipo.mimeCanonico,
      tamano: file.size,
      fechaSubida: new Date().toISOString(),
      subidoPor: actorId,
    };

    this.archivos.set(id, archivo);
    return { ...archivo };
  }

  obtenerPorId(id: string, actorId: string): Archivo {
    return { ...this.buscarAutorizado(id, actorId) };
  }

  async obtenerParaDescarga(id: string, actorId: string): Promise<{ archivo: Archivo; rutaFisica: string }> {
    const archivo = this.buscarAutorizado(id, actorId);
    const rutaFisica = join(this.storageDir, archivo.nombreAlmacenado);

    if (!existsSync(rutaFisica)) {
      throw new NotFoundException('Archivo no disponible.');
    }

    return { archivo: { ...archivo }, rutaFisica };
  }

  /**
   * Regla provisional fail-closed: solo quien subió el archivo puede
   * consultarlo/descargarlo. Es TEMPORAL y segura mientras Mensajería y
   * Formatos todavía no existen para aportar su propia regla de
   * autorización (p. ej. "remitente/destinatarios de este mensaje" o
   * "cualquier sesión puede leer este recurso institucional publicado").
   * NO se crea aquí ninguna ACL genérica ni reference counting — cuando
   * esos dominios existan, decidirán explícitamente cómo ampliar esta
   * política.
   */
  private buscarAutorizado(id: string, actorId: string): Archivo {
    const archivo = this.archivos.get(id);

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado.');
    }

    if (archivo.subidoPor !== actorId) {
      throw new ForbiddenException('No tiene acceso a este archivo.');
    }

    return archivo;
  }
}
