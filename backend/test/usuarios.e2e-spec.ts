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
      return request(app.getHttpServer()).get('/api/auth/me').expect(200).expect({
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

  describe('integridad de Administración', () => {
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

    it('auto-desactivación: un Administrador no puede desactivarse a sí mismo → 409', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-1/estado')
        .send({ estado: 'Inactivo' })
        .expect(409);
    });

    it('último Administrador activo → Usuario se rechaza → 409', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-1')
        .send({ rol: 'Usuario' })
        .expect(409);
    });

    it('último Administrador activo → Inactivo se rechaza incluso tras haber tenido más de uno → 409', async () => {
      const server = app.getHttpServer();

      await request(server)
        .patch('/api/usuarios/dev-usuario-2')
        .send({ rol: 'Administrador' })
        .expect(200);
      await request(server)
        .patch('/api/usuarios/dev-usuario-2/estado')
        .send({ estado: 'Inactivo' })
        .expect(200);

      return request(server)
        .patch('/api/usuarios/dev-usuario-1/estado')
        .send({ estado: 'Inactivo' })
        .expect(409);
    });

    it('la modificación sobre otro usuario (no-Administrador) sigue funcionando', async () => {
      const server = app.getHttpServer();

      await request(server)
        .patch('/api/usuarios/dev-usuario-2/estado')
        .send({ estado: 'Inactivo' })
        .expect(200);

      return request(server)
        .patch('/api/usuarios/dev-usuario-2/estado')
        .send({ estado: 'Activo' })
        .expect(200);
    });

    it('con más de un Administrador activo, uno puede desactivar y cambiar el rol del otro', async () => {
      const server = app.getHttpServer();

      await request(server)
        .patch('/api/usuarios/dev-usuario-2')
        .send({ rol: 'Administrador' })
        .expect(200);

      await request(server)
        .patch('/api/usuarios/dev-usuario-2/estado')
        .send({ estado: 'Inactivo' })
        .expect(200);

      await request(server)
        .patch('/api/usuarios/dev-usuario-2/estado')
        .send({ estado: 'Activo' })
        .expect(200);

      return request(server)
        .patch('/api/usuarios/dev-usuario-2')
        .send({ rol: 'Usuario' })
        .expect(200);
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

describe('Usuarios: integridad de peticiones parciales', () => {
  let app: INestApplication<App>;
  const envOriginal = { ...process.env };
  beforeEach(async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_MODE = 'development';
    process.env.DEV_USER_ID = 'dev-usuario-1';
    app = await crearApp();
  });
  afterEach(async () => {
    await app.close();
    process.env = { ...envOriginal };
  });
  it('modificar solo el nombre conserva usuario y rol del último administrador', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/api/usuarios/dev-usuario-1')
      .send({ nombre: 'Nuevo nombre' })
      .expect(200);
    expect(respuesta.body).toMatchObject({
      nombre: 'Nuevo nombre',
      usuario: 'usuario.prueba.uno',
      rol: 'Administrador',
      estado: 'Activo',
    });
    await request(app.getHttpServer())
      .patch('/api/usuarios/dev-usuario-2/estado')
      .send({ estado: 'Inactivo' })
      .expect(200);
  });
  it.each(['nombre', 'usuario', 'rol'])(
    'rechaza null en %s sin modificar el usuario',
    async (campo) => {
      const anterior = await request(app.getHttpServer())
        .get('/api/usuarios/dev-usuario-1')
        .expect(200);
      await request(app.getHttpServer())
        .patch('/api/usuarios/dev-usuario-1')
        .send({ [campo]: null })
        .expect(400);
      const posterior = await request(app.getHttpServer())
        .get('/api/usuarios/dev-usuario-1')
        .expect(200);
      expect(posterior.body).toEqual(anterior.body);
    },
  );
  it('rechaza usuarios duplicados sin aplicar otros campos', async () => {
    await request(app.getHttpServer())
      .patch('/api/usuarios/dev-usuario-2')
      .send({ usuario: 'usuario.prueba.uno', nombre: 'No guardar' })
      .expect(409);
    const usuario = await request(app.getHttpServer())
      .get('/api/usuarios/dev-usuario-2')
      .expect(200);
    expect(usuario.body.nombre).toBe('Usuario de Prueba Dos');
  });
  it('una cuenta desactivada no puede recuperar identidad ni acceder a mensajes', async () => {
    await request(app.getHttpServer())
      .patch('/api/usuarios/dev-usuario-2/estado')
      .send({ estado: 'Inactivo' })
      .expect(200);
    process.env.DEV_USER_ID = 'dev-usuario-2';
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer()).get('/api/mensajes/recibidos').expect(401);
  });
});
