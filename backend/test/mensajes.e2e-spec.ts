import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './../src/app.module';

const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
const STORAGE_DIR = join(process.cwd(), 'storage', 'archivos');

const USUARIO_1 = 'dev-usuario-1';
const USUARIO_2 = 'dev-usuario-2';
const USUARIO_3 = 'dev-usuario-3';

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

describe('Mensajería (e2e)', () => {
  const envOriginal = { ...process.env };
  let app: INestApplication<App>;

  function comoActor(id: string): void {
    process.env.DEV_USER_ID = id;
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_MODE = 'development';
    comoActor(USUARIO_1);
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
    process.env = { ...envOriginal };
    if (existsSync(STORAGE_DIR)) {
      rmSync(STORAGE_DIR, { recursive: true, force: true });
    }
  });

  describe('GET /api/health sigue disponible', () => {
    it('responde 200', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });
  });

  describe('flujo principal: Usuario 1 envía a Usuario 2 y 3', () => {
    let mensajeId: string;

    it('POST /api/mensajes → 201', async () => {
      comoActor(USUARIO_1);
      const respuesta = await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Asunto de prueba',
          descripcion: 'Contenido de prueba',
          destinatarioIds: [USUARIO_2, USUARIO_3],
        })
        .expect(201);

      mensajeId = respuesta.body.id;
      expect(respuesta.body.remitenteId).toBe(USUARIO_1);
      expect(respuesta.body.titulo).toBe('Asunto de prueba');
    });

    it('recibidos de Usuario 2 incluye el mensaje', async () => {
      comoActor(USUARIO_2);
      const respuesta = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);

      expect(respuesta.body.some((m: any) => m.id === mensajeId)).toBe(true);
    });

    it('recibidos de Usuario 3 incluye el mensaje', async () => {
      comoActor(USUARIO_3);
      const respuesta = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);

      expect(respuesta.body.some((m: any) => m.id === mensajeId)).toBe(true);
    });

    it('enviados de Usuario 1 incluye el mensaje', async () => {
      comoActor(USUARIO_1);
      const respuesta = await request(app.getHttpServer()).get('/api/mensajes/enviados').expect(200);

      expect(respuesta.body.some((m: any) => m.id === mensajeId)).toBe(true);
    });

    it('GET detalle NO marca Visto', async () => {
      comoActor(USUARIO_2);
      await request(app.getHttpServer()).get(`/api/mensajes/${mensajeId}`).expect(200);

      const recibidos = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);
      const propio = recibidos.body.find((m: any) => m.id === mensajeId);
      expect(propio.estadoLectura).toBe('Nuevo');
    });

    it('PATCH visto de Usuario 2 solo marca a Usuario 2', async () => {
      comoActor(USUARIO_2);
      await request(app.getHttpServer()).patch(`/api/mensajes/${mensajeId}/visto`).expect(200);

      const recibidosDos = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);
      expect(recibidosDos.body.find((m: any) => m.id === mensajeId).estadoLectura).toBe('Visto');

      comoActor(USUARIO_3);
      const recibidosTres = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);
      expect(recibidosTres.body.find((m: any) => m.id === mensajeId).estadoLectura).toBe('Nuevo');
    });

    it('PATCH editar de Usuario 1 → 409 (ya hay un Visto)', async () => {
      comoActor(USUARIO_1);
      return request(app.getHttpServer())
        .patch(`/api/mensajes/${mensajeId}`)
        .send({ titulo: 'Intento de edición' })
        .expect(409);
    });

    it('PATCH cancelar de Usuario 1 → 409 (ya hay un Visto)', async () => {
      comoActor(USUARIO_1);
      return request(app.getHttpServer()).patch(`/api/mensajes/${mensajeId}/cancelar`).expect(409);
    });

    it('Usuario 2 responde: original queda Respondido solo para Usuario 2', async () => {
      comoActor(USUARIO_2);
      await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Re: Asunto de prueba',
          descripcion: 'Respuesta',
          destinatarioIds: [USUARIO_1],
          respuestaAId: mensajeId,
        })
        .expect(201);

      const detalleDos = await request(app.getHttpServer()).get(`/api/mensajes/${mensajeId}`).expect(200);
      expect(detalleDos.body.estadoRespuesta).toBe('Respondido');

      comoActor(USUARIO_3);
      const detalleTres = await request(app.getHttpServer()).get(`/api/mensajes/${mensajeId}`).expect(200);
      expect(detalleTres.body.estadoRespuesta).toBe('Pendiente');
    });

    it('un tercero no autorizado recibe 403 al pedir el detalle', async () => {
      comoActor(USUARIO_1);
      const otro = await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Solo para Usuario 2',
          descripcion: 'Contenido',
          destinatarioIds: [USUARIO_2],
        });

      comoActor(USUARIO_3);
      return request(app.getHttpServer()).get(`/api/mensajes/${otro.body.id}`).expect(403);
    });
  });

  describe('adjuntos vía Mensajería', () => {
    let mensajeId: string;
    let archivoId: string;
    let archivoAjenoId: string;

    it('prepara: Usuario 1 sube un archivo y lo adjunta a un mensaje para Usuario 2', async () => {
      comoActor(USUARIO_1);
      const subida = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'adjunto.pdf');
      archivoId = subida.body.id;

      const otraSubida = await request(app.getHttpServer())
        .post('/api/archivos')
        .attach('archivo', PDF_BUFFER, 'no-asociado.pdf');
      archivoAjenoId = otraSubida.body.id;

      const mensaje = await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Con adjunto',
          descripcion: 'Contenido',
          destinatarioIds: [USUARIO_2],
          archivoIds: [archivoId],
        })
        .expect(201);

      mensajeId = mensaje.body.id;
    });

    it('el remitente puede descargar el adjunto', async () => {
      comoActor(USUARIO_1);
      const descarga = await request(app.getHttpServer())
        .get(`/api/mensajes/${mensajeId}/adjuntos/${archivoId}/descarga`)
        .expect(200);

      expect(descarga.headers['content-disposition']).toContain('adjunto.pdf');
    });

    it('el destinatario puede descargar el adjunto vía Mensajería aunque no lo subió', async () => {
      comoActor(USUARIO_2);
      return request(app.getHttpServer())
        .get(`/api/mensajes/${mensajeId}/adjuntos/${archivoId}/descarga`)
        .expect(200);
    });

    it('un tercero recibe 403', async () => {
      comoActor(USUARIO_3);
      return request(app.getHttpServer())
        .get(`/api/mensajes/${mensajeId}/adjuntos/${archivoId}/descarga`)
        .expect(403);
    });

    it('un archivoId no asociado al mensaje → 404', async () => {
      comoActor(USUARIO_2);
      return request(app.getHttpServer())
        .get(`/api/mensajes/${mensajeId}/adjuntos/${archivoAjenoId}/descarga`)
        .expect(404);
    });

    it('mensaje Eliminado → adjunto no disponible', async () => {
      comoActor(USUARIO_1);
      await request(app.getHttpServer()).patch(`/api/mensajes/${mensajeId}/eliminar`).expect(200);

      comoActor(USUARIO_2);
      return request(app.getHttpServer())
        .get(`/api/mensajes/${mensajeId}/adjuntos/${archivoId}/descarga`)
        .expect(404);
    });
  });

  describe('visto sobre un mensaje no disponible', () => {
    it('PATCH /:id/visto sobre un mensaje Cancelado → 409', async () => {
      comoActor(USUARIO_1);
      const creado = await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Se cancelará antes de marcar visto',
          descripcion: 'Contenido',
          destinatarioIds: [USUARIO_2],
        });
      const id = creado.body.id;

      await request(app.getHttpServer()).patch(`/api/mensajes/${id}/cancelar`).expect(200);

      comoActor(USUARIO_2);
      return request(app.getHttpServer()).patch(`/api/mensajes/${id}/visto`).expect(409);
    });
  });

  describe('cancelación de un mensaje no leído', () => {
    it('desaparece de recibidos y permanece Cancelado en enviados', async () => {
      comoActor(USUARIO_1);
      const creado = await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Se cancelará',
          descripcion: 'Contenido',
          destinatarioIds: [USUARIO_2],
        });
      const id = creado.body.id;

      await request(app.getHttpServer()).patch(`/api/mensajes/${id}/cancelar`).expect(200);

      comoActor(USUARIO_2);
      const recibidos = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);
      expect(recibidos.body.some((m: any) => m.id === id)).toBe(false);

      comoActor(USUARIO_1);
      const enviados = await request(app.getHttpServer()).get('/api/mensajes/enviados').expect(200);
      const propio = enviados.body.find((m: any) => m.id === id);
      expect(propio.estado).toBe('Cancelado');
    });
  });

  describe('eliminación', () => {
    it('el receptor recibe solo tombstone, sin contenido ni archivoIds', async () => {
      comoActor(USUARIO_1);
      const creado = await request(app.getHttpServer())
        .post('/api/mensajes')
        .send({
          titulo: 'Se eliminará',
          descripcion: 'Contenido sensible',
          destinatarioIds: [USUARIO_2],
        });
      const id = creado.body.id;

      await request(app.getHttpServer()).patch(`/api/mensajes/${id}/eliminar`).expect(200);

      comoActor(USUARIO_2);
      const recibidos = await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(200);
      const propio = recibidos.body.find((m: any) => m.id === id);

      expect(propio.estado).toBe('Eliminado');
      expect(propio.contenidoDisponible).toBe(false);
      expect(propio.titulo).toBeUndefined();
      expect(propio.descripcion).toBeUndefined();
      expect(propio.archivoIds).toBeUndefined();
    });
  });

  describe('validación de entrada', () => {
    it('DTO inválido (título vacío) → 400', async () => {
      comoActor(USUARIO_1);
      return request(app.getHttpServer())
        .post('/api/mensajes')
        .send({ titulo: '', descripcion: 'x', destinatarioIds: [USUARIO_2] })
        .expect(400);
    });

    it('DTO inválido (sin destinatarios) → 400', async () => {
      comoActor(USUARIO_1);
      return request(app.getHttpServer())
        .post('/api/mensajes')
        .send({ titulo: 'x', descripcion: 'x', destinatarioIds: [] })
        .expect(400);
    });

    it('DTO inválido (destinatarios duplicados) → 400', async () => {
      comoActor(USUARIO_1);
      return request(app.getHttpServer())
        .post('/api/mensajes')
        .send({ titulo: 'x', descripcion: 'x', destinatarioIds: [USUARIO_2, USUARIO_2] })
        .expect(400);
    });
  });
});
