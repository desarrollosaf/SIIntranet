import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ArchivosService, sanearNombreParaDescarga } from './archivos.service';

function crc32(buf: Buffer): number {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function buildEntry(entryName: string, content: string) {
  const nameBuf = Buffer.from(entryName, 'utf8');
  const dataBuf = Buffer.from(content, 'utf8');
  const crc = crc32(dataBuf);

  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(dataBuf.length, 18);
  localHeader.writeUInt32LE(dataBuf.length, 22);
  localHeader.writeUInt16LE(nameBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);
  const localEntry = Buffer.concat([localHeader, nameBuf, dataBuf]);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(0, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(dataBuf.length, 20);
  centralHeader.writeUInt32LE(dataBuf.length, 24);
  centralHeader.writeUInt16LE(nameBuf.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(0, 42);
  const centralEntry = Buffer.concat([centralHeader, nameBuf]);

  return { localEntry, centralEntry };
}

function buildStoredZip(entries: [string, string][]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];

  for (const [name, content] of entries) {
    const { localEntry, centralEntry } = buildEntry(name, content);
    locals.push(localEntry);
    centrals.push(centralEntry);
  }

  const centralStart = locals.reduce((sum, b) => sum + b.length, 0);
  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, ...centrals, eocd]);
}

function contentTypesXml(mainPartName: string, mainMime: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="${mainPartName}" ContentType="${mainMime}.main+xml"/></Types>`;
}

const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');

const DOCX_BUFFER = buildStoredZip([
  [
    '[Content_Types].xml',
    contentTypesXml(
      '/word/document.xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ),
  ],
  ['word/document.xml', '<xml/>'],
]);

const XLSX_BUFFER = buildStoredZip([
  [
    '[Content_Types].xml',
    contentTypesXml(
      '/xl/workbook.xml',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ),
  ],
  ['xl/workbook.xml', '<xml/>'],
]);

const PPTX_BUFFER = buildStoredZip([
  [
    '[Content_Types].xml',
    contentTypesXml(
      '/ppt/presentation.xml',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ),
  ],
  ['ppt/presentation.xml', '<xml/>'],
]);

// Contenedor OLE/CFB genuino — mismo binario para .doc/.xls/.ppt legacy,
// ver comentario en archivos.service.ts sobre por qué file-type no puede
// distinguirlos entre sí por contenido.
const CFB_BUFFER = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.alloc(512 - 8),
]);

const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0]);

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
]);

function archivoMulter(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'archivo',
    originalname: 'documento.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: PDF_BUFFER,
    size: PDF_BUFFER.length,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('ArchivosService', () => {
  let tempDir: string;
  let service: ArchivosService;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'archivos-test-'));
    service = new ArchivosService(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('guarda metadata y contenido físico de un archivo válido', async () => {
    const archivo = await service.guardar(archivoMulter(), 'dev-usuario-1');

    expect(archivo.nombreOriginal).toBe('documento.pdf');
    expect(archivo.subidoPor).toBe('dev-usuario-1');
    expect(existsSync(join(tempDir, archivo.nombreAlmacenado))).toBe(true);
  });

  it('rechaza una extensión fuera de la whitelist', async () => {
    await expect(
      service.guardar(archivoMulter({ originalname: 'script.exe' }), 'dev-usuario-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza contenido que no coincide con la extensión declarada', async () => {
    const archivoFalso = archivoMulter({
      originalname: 'falso.pdf',
      buffer: Buffer.from('esto no es un pdf'),
    });

    await expect(service.guardar(archivoFalso, 'dev-usuario-1')).rejects.toThrow(BadRequestException);
  });

  it('acepta un DOCX real (OOXML) por contenido', async () => {
    const archivo = await service.guardar(
      archivoMulter({
        originalname: 'informe.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: DOCX_BUFFER,
        size: DOCX_BUFFER.length,
      }),
      'dev-usuario-1',
    );

    expect(archivo.nombreOriginal).toBe('informe.docx');
  });

  it('genera ids y nombres internos distintos aunque el nombre original se repita', async () => {
    const primero = await service.guardar(archivoMulter(), 'dev-usuario-1');
    const segundo = await service.guardar(archivoMulter(), 'dev-usuario-1');

    expect(primero.id).not.toBe(segundo.id);
    expect(primero.nombreAlmacenado).not.toBe(segundo.nombreAlmacenado);
  });

  it('la ruta física nunca depende de originalname (intento de path traversal)', async () => {
    const archivo = await service.guardar(
      archivoMulter({ originalname: '../../evil.pdf' }),
      'dev-usuario-1',
    );

    expect(archivo.nombreAlmacenado).not.toContain('..');
    expect(existsSync(join(tempDir, archivo.nombreAlmacenado))).toBe(true);
    expect(existsSync(join(tempDir, '..', 'evil.pdf'))).toBe(false);
    expect(readdirSync(tempDir)).toContain(archivo.nombreAlmacenado);
  });

  it('el actor que subió el archivo puede obtenerlo', async () => {
    const archivo = await service.guardar(archivoMulter(), 'dev-usuario-1');

    expect(service.obtenerPorId(archivo.id, 'dev-usuario-1').id).toBe(archivo.id);
  });

  it('otro actor recibe ForbiddenException', async () => {
    const archivo = await service.guardar(archivoMulter(), 'dev-usuario-1');

    expect(() => service.obtenerPorId(archivo.id, 'dev-usuario-2')).toThrow(ForbiddenException);
  });

  it('un id inexistente lanza NotFoundException', () => {
    expect(() => service.obtenerPorId('no-existe', 'dev-usuario-1')).toThrow(NotFoundException);
  });

  it('obtenerParaDescarga devuelve la ruta física del uploader', async () => {
    const archivo = await service.guardar(archivoMulter(), 'dev-usuario-1');

    const resultado = await service.obtenerParaDescarga(archivo.id, 'dev-usuario-1');

    expect(resultado.rutaFisica).toBe(join(tempDir, archivo.nombreAlmacenado));
  });

  it('obtenerParaDescarga rechaza a otro actor', async () => {
    const archivo = await service.guardar(archivoMulter(), 'dev-usuario-1');

    await expect(service.obtenerParaDescarga(archivo.id, 'dev-usuario-2')).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('matriz permanente de formatos permitidos', () => {
    const casos: Array<{
      nombre: string;
      originalname: string;
      mimetype: string;
      buffer: Buffer;
      mimeCanonicoEsperado: string;
    }> = [
      {
        nombre: 'PDF',
        originalname: 'documento.pdf',
        mimetype: 'application/pdf',
        buffer: PDF_BUFFER,
        mimeCanonicoEsperado: 'application/pdf',
      },
      {
        nombre: 'DOC',
        originalname: 'documento.doc',
        mimetype: 'application/msword',
        buffer: CFB_BUFFER,
        mimeCanonicoEsperado: 'application/msword',
      },
      {
        nombre: 'DOCX',
        originalname: 'documento.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: DOCX_BUFFER,
        mimeCanonicoEsperado: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      {
        nombre: 'XLS',
        originalname: 'hoja.xls',
        mimetype: 'application/vnd.ms-excel',
        buffer: CFB_BUFFER,
        mimeCanonicoEsperado: 'application/vnd.ms-excel',
      },
      {
        nombre: 'XLSX',
        originalname: 'hoja.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: XLSX_BUFFER,
        mimeCanonicoEsperado: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        nombre: 'PPT',
        originalname: 'presentacion.ppt',
        mimetype: 'application/vnd.ms-powerpoint',
        buffer: CFB_BUFFER,
        mimeCanonicoEsperado: 'application/vnd.ms-powerpoint',
      },
      {
        nombre: 'PPTX',
        originalname: 'presentacion.pptx',
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        buffer: PPTX_BUFFER,
        mimeCanonicoEsperado: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
      {
        nombre: 'JPG',
        originalname: 'foto.jpg',
        mimetype: 'image/jpeg',
        buffer: JPEG_BUFFER,
        mimeCanonicoEsperado: 'image/jpeg',
      },
      {
        nombre: 'JPEG',
        originalname: 'foto.jpeg',
        mimetype: 'image/jpeg',
        buffer: JPEG_BUFFER,
        mimeCanonicoEsperado: 'image/jpeg',
      },
      {
        nombre: 'PNG',
        originalname: 'imagen.png',
        mimetype: 'image/png',
        buffer: PNG_BUFFER,
        mimeCanonicoEsperado: 'image/png',
      },
    ];

    it.each(casos)(
      '$nombre válido (extensión + MIME declarado + contenido) es aceptado con el MIME canónico correcto',
      async ({ originalname, mimetype, buffer, mimeCanonicoEsperado }) => {
        const archivo = await service.guardar(
          archivoMulter({ originalname, mimetype, buffer, size: buffer.length }),
          'dev-usuario-1',
        );

        expect(archivo.mimeType).toBe(mimeCanonicoEsperado);
      },
    );
  });

  describe('rechazos de MIME declarado incompatible', () => {
    it('DOC con MIME de XLS es rechazado', async () => {
      await expect(
        service.guardar(
          archivoMulter({
            originalname: 'documento.doc',
            mimetype: 'application/vnd.ms-excel',
            buffer: CFB_BUFFER,
          }),
          'dev-usuario-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('XLS con MIME de DOC es rechazado', async () => {
      await expect(
        service.guardar(
          archivoMulter({
            originalname: 'hoja.xls',
            mimetype: 'application/msword',
            buffer: CFB_BUFFER,
          }),
          'dev-usuario-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PDF con MIME incompatible es rechazado', async () => {
      await expect(
        service.guardar(
          archivoMulter({
            originalname: 'documento.pdf',
            mimetype: 'application/octet-stream',
            buffer: PDF_BUFFER,
          }),
          'dev-usuario-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('contenido falso (MIME y extensión correctos, bytes reales distintos) es rechazado', async () => {
      await expect(
        service.guardar(
          archivoMulter({
            originalname: 'falso.png',
            mimetype: 'image/png',
            buffer: Buffer.from('no es un png real'),
          }),
          'dev-usuario-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

describe('sanearNombreParaDescarga', () => {
  it('elimina separadores de ruta', () => {
    expect(sanearNombreParaDescarga('carpeta/sub\\archivo.pdf')).toBe('carpeta_sub_archivo.pdf');
  });

  it('elimina CR y LF', () => {
    expect(sanearNombreParaDescarga('archivo\r\nmalicioso.pdf')).toBe('archivomalicioso.pdf');
  });

  it('elimina caracteres de control', () => {
    expect(sanearNombreParaDescarga('archivo\x00\x07malicioso.pdf')).toBe('archivomalicioso.pdf');
  });

  it('conserva comillas y punto y coma (los codifica de forma segura el propio Content-Disposition, no el saneador)', () => {
    expect(sanearNombreParaDescarga('archivo "raro"; nombre.pdf')).toBe('archivo "raro"; nombre.pdf');
  });

  it('nunca devuelve una cadena vacía', () => {
    expect(sanearNombreParaDescarga('\r\n\x00\x01')).toBe('archivo');
  });
});
