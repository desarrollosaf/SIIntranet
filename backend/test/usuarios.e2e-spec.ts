import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

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

describe('Usuarios + identidad de desarrollo (e2e)', () => {
  const envOriginal = { ...process.env };

  afterEach(() => {
    process.env = { ...envOriginal };
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

    it('GET /api/usuarios sin identidad → 401', () => {
      return request(app.getHttpServer()).get('/api/usuarios').expect(401);
    });

    it('GET /api/health sigue respondiendo 200', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });
  });

  describe('identidad de desarrollo: rol Usuario', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_MODE = 'development';
      process.env.DEV_USER_ID = 'dev-usuario-2';
      app = await crearApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('GET /api/usuarios → 200', () => {
      return request(app.getHttpServer()).get('/api/usuarios').expect(200);
    });

    it('GET /api/auth/me devuelve el actor configurado por el servidor', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(200)
        .expect({
          id: 'dev-usuario-2',
          nombre: 'Usuario de Prueba Dos',
          usuario: 'usuario.prueba.dos',
          rol: 'Usuario',
        });
    });

    it('PATCH /api/usuarios/:id → 403', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-3')
        .send({ nombre: 'Otro nombre' })
        .expect(403);
    });

    it('PATCH /api/usuarios/:id/estado → 403', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-3/estado')
        .send({ estado: 'Inactivo' })
        .expect(403);
    });
  });

  describe('identidad de desarrollo: rol Administrador', () => {
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

    it('PATCH /api/usuarios/:id → 200', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-3')
        .send({ nombre: 'Nombre actualizado' })
        .expect(200);
    });

    it('PATCH /api/usuarios/:id/estado → 200', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-3/estado')
        .send({ estado: 'Activo' })
        .expect(200);
    });

    it('PATCH con estado inválido (fuera de UserStatus) → 400', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-3/estado')
        .send({ estado: 'Loco' })
        .expect(400);
    });

    it('PATCH con campo no declarado en el DTO (password) → 400', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-3')
        .send({ nombre: 'Nombre', password: 'intento-de-colar-password' })
        .expect(400);
    });
  });

  describe('NODE_ENV distinto de development con AUTH_MODE=development', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.AUTH_MODE = 'development';
      process.env.DEV_USER_ID = 'dev-usuario-1';
    });

    it('rechaza el arranque con una combinación peligrosa', async () => {
      await expect(crearApp()).rejects.toThrow();
    });
  });
});
