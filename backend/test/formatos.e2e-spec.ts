import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './../src/app.module';

const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
const STORAGE_DIR = join(process.cwd(), 'storage', 'archivos');

const ADMINISTRADOR = 'dev-usuario-1';
const USUARIO = 'dev-usuario-2';

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

async function subirArchivo(app: INestApplication<App>, nombre = 'documento.pdf') {
  const respuesta = await request(app.getHttpServer())
    .post('/api/archivos')
    .attach('archivo', PDF_BUFFER, nombre);
  return respuesta.body.id as string;
}

describe('Formatos (e2e)', () => {
  const envOriginal = { ...process.env };

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

    it('GET /api/formatos sin identidad → 401', () => {
      return request(app.getHttpServer()).get('/api/formatos').expect(401);
    });

    it('GET /api/health sigue respondiendo 200', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });
  });

  describe('con identidad de desarrollo activa', () => {
    let app: INestApplication<App>;

    function comoActor(id: string): void {
      process.env.DEV_USER_ID = id;
    }

    beforeAll(async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_MODE = 'development';
      comoActor(ADMINISTRADOR);
      app = await crearApp();
    });

    afterAll(async () => {
      await app.close();
      process.env = { ...envOriginal };
      if (existsSync(STORAGE_DIR)) {
        rmSync(STORAGE_DIR, { recursive: true, force: true });
      }
    });

    describe('Administrador: alta, lectura, actualización, estado y descarga', () => {
      let archivoId: string;
      let formatoId: string;

      it('prepara: sube un archivo propio', async () => {
        comoActor(ADMINISTRADOR);
        archivoId = await subirArchivo(app, 'formato-original.pdf');
        expect(archivoId).toBeDefined();
      });

      it('POST /api/formatos → 201 con respuesta pública enriquecida y sin datos internos', async () => {
        comoActor(ADMINISTRADOR);
        const respuesta = await request(app.getHttpServer())
          .post('/api/formatos')
          .send({
            nombre: 'Solicitud de vacaciones',
            descripcion: 'Formato para solicitar días de vacaciones',
            categoria: 'Recursos Humanos',
            archivoId,
          })
          .expect(201);

        formatoId = respuesta.body.id;

        expect(respuesta.body).toMatchObject({
          nombre: 'Solicitud de vacaciones',
          descripcion: 'Formato para solicitar días de vacaciones',
          categoria: 'Recursos Humanos',
          estado: 'Activo',
        });
        expect(respuesta.body.id).toBeDefined();
        expect(respuesta.body.fechaCreacion).toBeDefined();

        expect(respuesta.body.archivo).toMatchObject({
          id: archivoId,
          nombreOriginal: 'formato-original.pdf',
          mimeType: 'application/pdf',
        });
        expect(respuesta.body.archivo.tamano).toBeDefined();
        expect(respuesta.body.archivo.fechaSubida).toBeDefined();

        expect(respuesta.body.archivo.nombreAlmacenado).toBeUndefined();
        expect(respuesta.body.archivo.subidoPor).toBeUndefined();
        expect(respuesta.body.rutaFisica).toBeUndefined();
      });

      it('GET /api/formatos → incluye el Formato recién creado', async () => {
        const respuesta = await request(app.getHttpServer()).get('/api/formatos').expect(200);
        expect(respuesta.body.some((f: any) => f.id === formatoId)).toBe(true);
      });

      it('GET /api/formatos/:id → 200', async () => {
        const respuesta = await request(app.getHttpServer())
          .get(`/api/formatos/${formatoId}`)
          .expect(200);
        expect(respuesta.body.id).toBe(formatoId);
      });

      it('GET /api/formatos/:id/descarga → 200 con Content-Type y Content-Disposition attachment', async () => {
        const respuesta = await request(app.getHttpServer())
          .get(`/api/formatos/${formatoId}/descarga`)
          .expect(200);

        expect(respuesta.headers['content-type']).toContain('application/pdf');
        expect(respuesta.headers['content-disposition']).toContain('attachment');
        expect(respuesta.headers['content-disposition']).toContain('formato-original.pdf');
      });

      it('PATCH /api/formatos/:id → 200', async () => {
        const respuesta = await request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}`)
          .send({ nombre: 'Solicitud de vacaciones (actualizado)' })
          .expect(200);

        expect(respuesta.body.nombre).toBe('Solicitud de vacaciones (actualizado)');
      });

      it('PATCH /api/formatos/:id/estado → 200', async () => {
        const respuesta = await request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}/estado`)
          .send({ estado: 'Inactivo' })
          .expect(200);

        expect(respuesta.body.estado).toBe('Inactivo');
      });

      it('PATCH /api/formatos/:id/estado con valor inválido → 400', async () => {
        return request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}/estado`)
          .send({ estado: 'Loco' })
          .expect(400);
      });

      it('reactiva el Formato para no afectar describes posteriores', async () => {
        await request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}/estado`)
          .send({ estado: 'Activo' })
          .expect(200);
      });
    });

    describe('campos no permitidos (whitelist/forbidNonWhitelisted)', () => {
      let archivoId: string;

      beforeAll(async () => {
        comoActor(ADMINISTRADOR);
        archivoId = await subirArchivo(app, 'whitelist.pdf');
      });

      it('POST con "estado" en el body → 400', () => {
        return request(app.getHttpServer())
          .post('/api/formatos')
          .send({
            nombre: 'Formato con estado forzado',
            descripcion: 'Descripción',
            categoria: 'Categoría',
            archivoId,
            estado: 'Inactivo',
          })
          .expect(400);
      });

      it('PATCH /:id con "estado" en el body → 400', async () => {
        const creado = await request(app.getHttpServer()).post('/api/formatos').send({
          nombre: 'Formato válido',
          descripcion: 'Descripción',
          categoria: 'Categoría',
          archivoId,
        });

        return request(app.getHttpServer())
          .patch(`/api/formatos/${creado.body.id}`)
          .send({ nombre: 'Otro nombre', estado: 'Inactivo' })
          .expect(400);
      });
    });

    describe('archivo ajeno al crear/actualizar un Formato', () => {
      let archivoDeUsuario: string;

      beforeAll(async () => {
        comoActor(USUARIO);
        archivoDeUsuario = await subirArchivo(app, 'archivo-de-usuario.pdf');
        comoActor(ADMINISTRADOR);
      });

      it('POST /api/formatos con un archivoId ajeno → 403', () => {
        return request(app.getHttpServer())
          .post('/api/formatos')
          .send({
            nombre: 'Intento con archivo ajeno',
            descripcion: 'Descripción',
            categoria: 'Categoría',
            archivoId: archivoDeUsuario,
          })
          .expect(403);
      });

      it('PATCH /api/formatos/:id con un archivoId ajeno → 403 y sin mutación parcial', async () => {
        const archivoPropio = await subirArchivo(app, 'archivo-propio.pdf');
        const creado = await request(app.getHttpServer()).post('/api/formatos').send({
          nombre: 'Nombre original',
          descripcion: 'Descripción',
          categoria: 'Categoría',
          archivoId: archivoPropio,
        });

        await request(app.getHttpServer())
          .patch(`/api/formatos/${creado.body.id}`)
          .send({ nombre: 'Nombre que no debe aplicarse', archivoId: archivoDeUsuario })
          .expect(403);

        const sinCambios = await request(app.getHttpServer())
          .get(`/api/formatos/${creado.body.id}`)
          .expect(200);

        expect(sinCambios.body.nombre).toBe('Nombre original');
        expect(sinCambios.body.archivo.id).toBe(archivoPropio);
      });
    });

    describe('rol Usuario: lectura permitida, mutación prohibida', () => {
      let archivoId: string;
      let formatoId: string;

      beforeAll(async () => {
        comoActor(ADMINISTRADOR);
        archivoId = await subirArchivo(app, 'lectura-usuario.pdf');
        const creado = await request(app.getHttpServer()).post('/api/formatos').send({
          nombre: 'Formato visible para Usuario',
          descripcion: 'Descripción',
          categoria: 'Categoría',
          archivoId,
        });
        formatoId = creado.body.id;
        comoActor(USUARIO);
      });

      it('GET /api/formatos → 200', () => {
        return request(app.getHttpServer()).get('/api/formatos').expect(200);
      });

      it('GET /api/formatos/:id → 200', () => {
        return request(app.getHttpServer()).get(`/api/formatos/${formatoId}`).expect(200);
      });

      it('GET /api/formatos/:id/descarga → 200', () => {
        return request(app.getHttpServer()).get(`/api/formatos/${formatoId}/descarga`).expect(200);
      });

      it('POST /api/formatos → 403', () => {
        return request(app.getHttpServer())
          .post('/api/formatos')
          .send({
            nombre: 'Intento de Usuario normal',
            descripcion: 'Descripción',
            categoria: 'Categoría',
            archivoId,
          })
          .expect(403);
      });

      it('PATCH /api/formatos/:id → 403', () => {
        return request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}`)
          .send({ nombre: 'Intento de edición' })
          .expect(403);
      });

      it('PATCH /api/formatos/:id/estado → 403', () => {
        return request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}/estado`)
          .send({ estado: 'Inactivo' })
          .expect(403);
      });
    });

    describe('la descarga de Formatos no depende de ser uploader del archivo', () => {
      let archivoId: string;
      let formatoId: string;

      beforeAll(async () => {
        // El archivo pertenece al Administrador (quien lo subió y publicó el
        // Formato); Usuario no es su uploader.
        comoActor(ADMINISTRADOR);
        archivoId = await subirArchivo(app, 'uploader-vs-formatos.pdf');
        const creado = await request(app.getHttpServer()).post('/api/formatos').send({
          nombre: 'Documento institucional',
          descripcion: 'Descripción',
          categoria: 'Categoría',
          archivoId,
        });
        formatoId = creado.body.id;
        comoActor(USUARIO);
      });

      it('GET /api/formatos/:id/descarga como Usuario → 200 (autorizado por Formatos)', () => {
        return request(app.getHttpServer()).get(`/api/formatos/${formatoId}/descarga`).expect(200);
      });

      it('GET /api/archivos/:id/descarga directo como Usuario → 403 (uploader-only de Archivos intacto)', () => {
        return request(app.getHttpServer()).get(`/api/archivos/${archivoId}/descarga`).expect(403);
      });
    });

    describe('un Formato Inactivo no es visible en lectura pública', () => {
      let formatoId: string;

      beforeAll(async () => {
        comoActor(ADMINISTRADOR);
        const archivoId = await subirArchivo(app, 'sera-inactivo.pdf');
        const creado = await request(app.getHttpServer()).post('/api/formatos').send({
          nombre: 'Formato que será desactivado',
          descripcion: 'Descripción',
          categoria: 'Categoría',
          archivoId,
        });
        formatoId = creado.body.id;

        await request(app.getHttpServer())
          .patch(`/api/formatos/${formatoId}/estado`)
          .send({ estado: 'Inactivo' })
          .expect(200);

        comoActor(USUARIO);
      });

      it('GET /api/formatos → no incluye el Formato Inactivo', async () => {
        const respuesta = await request(app.getHttpServer()).get('/api/formatos').expect(200);
        expect(respuesta.body.some((f: any) => f.id === formatoId)).toBe(false);
      });

      it('GET /api/formatos/:id → 404', () => {
        return request(app.getHttpServer()).get(`/api/formatos/${formatoId}`).expect(404);
      });

      it('GET /api/formatos/:id/descarga → 404', () => {
        return request(app.getHttpServer()).get(`/api/formatos/${formatoId}/descarga`).expect(404);
      });
    });
  });
});
