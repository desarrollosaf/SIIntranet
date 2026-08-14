import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './../src/app.module';

const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
const STORAGE_DIR = join(process.cwd(), 'storage', 'archivos');

async function crearApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<App>();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  return app;
}

describe('Archivos (e2e)', () => {
  const envOriginal = { ...process.env };

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  afterAll(() => {
    if (existsSync(STORAGE_DIR)) {
      rmSync(STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('sin identidad de desarrollo activa', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      delete process.env.NODE_ENV;
      delete process.env.AUTH_MODE;
      delete process.env.DEV_USER_ID;
      app = await crearApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('POST /api/archivos sin identidad → 401', () => {
      return request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'documento.pdf')
        .expect(401);
    });

    it('GET /api/archivos/:id sin identidad → 401', () => {
      return request(app.getHttpServer()).get('/api/archivos/cualquiera').expect(401);
    });

    it('GET /api/archivos/:id/descarga sin identidad → 401', () => {
      return request(app.getHttpServer()).get('/api/archivos/cualquiera/descarga').expect(401);
    });

    it('GET /api/health sigue respondiendo 200', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });
  });

  describe('identidad de desarrollo: dev-usuario-1', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_MODE = 'development';
      process.env.DEV_USER_ID = 'dev-usuario-1';
      app = await crearApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('sube un PDF válido y devuelve metadata pública sin datos internos', async () => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'documento.pdf')
        .expect(201);

      expect(respuesta.body).toMatchObject({
        nombreOriginal: 'documento.pdf',
        mimeType: 'application/pdf',
      });
      expect(respuesta.body.id).toBeDefined();
      expect(respuesta.body.nombreAlmacenado).toBeUndefined();
      expect(respuesta.body.subidoPor).toBeUndefined();
    });

    it('obtiene la metadata del archivo recién subido', async () => {
      const subida = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'documento.pdf');

      await request(app.getHttpServer())
        .get(`/api/archivos/${subida.body.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.nombreOriginal).toBe('documento.pdf');
        });
    });

    it('descarga el archivo con Content-Disposition correcto', async () => {
      const subida = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'documento.pdf');

      const descarga = await request(app.getHttpServer())
        .get(`/api/archivos/${subida.body.id}/descarga`)
        .expect(200);

      expect(descarga.headers['content-disposition']).toContain('documento.pdf');
      expect(descarga.headers['content-type']).toContain('application/pdf');
    });

    it('un nombre con comillas, punto y coma y caracteres especiales produce un Content-Disposition válido y no inyecta cabeceras', async () => {
      const nombrePeligroso = 'archivo "raro"; nombre=malicioso, ñ é.pdf';

      const subida = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, nombrePeligroso);

      const descarga = await request(app.getHttpServer())
        .get(`/api/archivos/${subida.body.id}/descarga`)
        .expect(200);

      const cabecera = descarga.headers['content-disposition'];

      expect(typeof cabecera).toBe('string');
      expect(cabecera).not.toMatch(/[\r\n]/);
      expect(cabecera.startsWith('attachment')).toBe(true);
      // Debe seguir siendo exactamente una cabecera Content-Disposition, sin
      // que el nombre haya podido inyectar una segunda cabecera HTTP.
      expect(Object.keys(descarga.headers).filter((h) => h === 'content-disposition')).toHaveLength(1);
    });

    it('un tipo de archivo no permitido es rechazado', () => {
      return request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', Buffer.from('MZ...'), 'programa.exe')
        .expect(400);
    });

    it('un archivo cuyo contenido no coincide con la extensión declarada es rechazado', () => {
      return request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', Buffer.from('esto no es un pdf real'), 'falso.pdf')
        .expect(400);
    });

    it('un id inexistente devuelve 404', () => {
      return request(app.getHttpServer()).get('/api/archivos/no-existe').expect(404);
    });
  });

  describe('otro actor intenta acceder a un archivo ajeno', () => {
    let app: INestApplication<App>;
    let idArchivoDeUsuario1: string;

    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_MODE = 'development';
      process.env.DEV_USER_ID = 'dev-usuario-1';
      app = await crearApp();

      const subida = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'documento.pdf');
      idArchivoDeUsuario1 = subida.body.id;

      // Misma instancia de app (mismo ArchivosService, mismo Map en memoria):
      // ConfigService no cachea, así que DevIdentityMiddleware resuelve el
      // nuevo DEV_USER_ID en la siguiente petición sin recrear la app.
      process.env.DEV_USER_ID = 'dev-usuario-2';
    });

    afterEach(async () => {
      await app.close();
    });

    it('GET metadata de otro actor → 403', () => {
      return request(app.getHttpServer()).get(`/api/archivos/${idArchivoDeUsuario1}`).expect(403);
    });

    it('GET descarga de otro actor → 403', () => {
      return request(app.getHttpServer())
        .get(`/api/archivos/${idArchivoDeUsuario1}/descarga`)
        .expect(403);
    });
  });

  describe('límite de tamaño', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_MODE = 'development';
      process.env.DEV_USER_ID = 'dev-usuario-1';
      process.env.ARCHIVOS_MAX_BYTES = '10';
      app = await crearApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('un archivo que excede el límite configurado es rechazado', () => {
      return request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'documento.pdf')
        .expect(413);
    });
  });
});
