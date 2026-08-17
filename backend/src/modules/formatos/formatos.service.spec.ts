import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FormatosService } from './formatos.service';
import { ArchivosService } from '../archivos/archivos.service';
import { CreateFormatoDto } from './dto/create-formato.dto';

describe('FormatosService', () => {
  let service: FormatosService;
  let archivosService: { obtenerPorId: jest.Mock; obtenerParaUsoInterno: jest.Mock };

  const ARCHIVO_VALIDO = {
    id: 'archivo-1',
    nombreOriginal: 'documento.pdf',
    nombreAlmacenado: 'uuid-interno.pdf',
    mimeType: 'application/pdf',
    tamano: 1234,
    fechaSubida: '2026-01-01T00:00:00.000Z',
    subidoPor: 'dev-usuario-1',
  };

  function dto(overrides: Partial<CreateFormatoDto> = {}): CreateFormatoDto {
    return {
      nombre: 'Formato de prueba',
      descripcion: 'Descripción de prueba',
      categoria: 'Categoría de prueba',
      archivoId: ARCHIVO_VALIDO.id,
      ...overrides,
    };
  }

  beforeEach(() => {
    archivosService = {
      obtenerPorId: jest.fn().mockReturnValue({ ...ARCHIVO_VALIDO }),
      obtenerParaUsoInterno: jest.fn().mockResolvedValue({
        archivo: { ...ARCHIVO_VALIDO },
        rutaFisica: '/tmp/fake/ruta',
      }),
    };
    service = new FormatosService(archivosService as unknown as ArchivosService);
  });

  describe('crear', () => {
    it('crea un Formato con estado Activo', async () => {
      const formato = await service.crear(dto(), 'dev-usuario-1');
      expect(formato.estado).toBe('Activo');
    });

    it('genera id y fechaCreacion en el servidor, no desde el cliente', async () => {
      const formato = await service.crear(dto(), 'dev-usuario-1');
      expect(formato.id).toBeDefined();
      expect(typeof formato.id).toBe('string');
      expect(formato.fechaCreacion).toBeDefined();
    });

    it('valida el archivo vía ArchivosService.obtenerPorId antes de insertar', async () => {
      await service.crear(dto(), 'dev-usuario-1');
      expect(archivosService.obtenerPorId).toHaveBeenCalledWith(ARCHIVO_VALIDO.id, 'dev-usuario-1');
    });

    it('propaga NotFoundException si el archivo no existe', async () => {
      archivosService.obtenerPorId.mockImplementation(() => {
        throw new NotFoundException('Archivo no encontrado.');
      });

      await expect(service.crear(dto(), 'dev-usuario-1')).rejects.toThrow(NotFoundException);
    });

    it('propaga ForbiddenException si el archivo pertenece a otro actor', async () => {
      archivosService.obtenerPorId.mockImplementation(() => {
        throw new ForbiddenException('No tiene acceso a este archivo.');
      });

      await expect(service.crear(dto(), 'dev-usuario-1')).rejects.toThrow(ForbiddenException);
    });

    it('si la validación del archivo falla, no inserta el Formato', async () => {
      archivosService.obtenerPorId.mockImplementation(() => {
        throw new ForbiddenException();
      });

      await expect(service.crear(dto(), 'dev-usuario-1')).rejects.toThrow();

      const listado = await service.listar();
      expect(listado).toHaveLength(0);
    });
  });

  describe('listar', () => {
    it('solo incluye Formatos Activo', async () => {
      const activo = await service.crear(dto(), 'dev-usuario-1');
      const inactivo = await service.crear(dto({ nombre: 'Otro' }), 'dev-usuario-1');
      await service.cambiarEstado(inactivo.id, 'Inactivo');

      const listado = await service.listar();

      expect(listado.map((f) => f.id)).toContain(activo.id);
      expect(listado.map((f) => f.id)).not.toContain(inactivo.id);
    });

    it('la respuesta viene enriquecida con metadata del archivo', async () => {
      await service.crear(dto(), 'dev-usuario-1');
      const [publicado] = await service.listar();

      expect(publicado.archivo).toEqual({
        id: ARCHIVO_VALIDO.id,
        nombreOriginal: ARCHIVO_VALIDO.nombreOriginal,
        mimeType: ARCHIVO_VALIDO.mimeType,
        tamano: ARCHIVO_VALIDO.tamano,
        fechaSubida: ARCHIVO_VALIDO.fechaSubida,
      });
    });

    it('la respuesta no contiene nombreAlmacenado', async () => {
      await service.crear(dto(), 'dev-usuario-1');
      const [publicado] = await service.listar();

      expect((publicado.archivo as Record<string, unknown>).nombreAlmacenado).toBeUndefined();
    });

    it('la respuesta no contiene subidoPor', async () => {
      await service.crear(dto(), 'dev-usuario-1');
      const [publicado] = await service.listar();

      expect((publicado.archivo as Record<string, unknown>).subidoPor).toBeUndefined();
    });
  });

  describe('obtenerPorId', () => {
    it('devuelve un Formato Activo', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      const obtenido = await service.obtenerPorId(creado.id);

      expect(obtenido.id).toBe(creado.id);
    });

    it('un id inexistente lanza NotFoundException', async () => {
      await expect(service.obtenerPorId('no-existe')).rejects.toThrow(NotFoundException);
    });

    it('un Formato Inactivo lanza NotFoundException (política de lectura pública 13B)', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      await service.cambiarEstado(creado.id, 'Inactivo');

      await expect(service.obtenerPorId(creado.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizar', () => {
    it('actualiza nombre/descripcion/categoria', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');

      const actualizado = await service.actualizar(
        creado.id,
        { nombre: 'Nuevo nombre', descripcion: 'Nueva descripción', categoria: 'Nueva categoría' },
        'dev-usuario-1',
      );

      expect(actualizado.nombre).toBe('Nuevo nombre');
      expect(actualizado.descripcion).toBe('Nueva descripción');
      expect(actualizado.categoria).toBe('Nueva categoría');
    });

    it('cambiar el archivo revalida uploader-only contra el actor', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');

      await service.actualizar(creado.id, { archivoId: 'archivo-2' }, 'dev-usuario-1');

      expect(archivosService.obtenerPorId).toHaveBeenCalledWith('archivo-2', 'dev-usuario-1');
    });

    it('un fallo al validar el nuevo archivo no produce mutación parcial (nombre y archivoId originales permanecen)', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');

      archivosService.obtenerPorId.mockImplementationOnce(() => {
        throw new ForbiddenException('No tiene acceso a este archivo.');
      });

      await expect(
        service.actualizar(
          creado.id,
          { nombre: 'Nombre que no debe aplicarse', archivoId: 'archivo-ajeno' },
          'dev-usuario-1',
        ),
      ).rejects.toThrow(ForbiddenException);

      const sinCambios = await service.obtenerPorId(creado.id);
      expect(sinCambios.nombre).toBe(creado.nombre);
      expect(sinCambios.archivo.id).toBe(ARCHIVO_VALIDO.id);
    });

    it('puede actualizar un Formato Inactivo internamente (mutación administrativa)', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      await service.cambiarEstado(creado.id, 'Inactivo');

      const actualizado = await service.actualizar(creado.id, { nombre: 'Nombre nuevo' }, 'dev-usuario-1');

      expect(actualizado.nombre).toBe('Nombre nuevo');
      expect(actualizado.estado).toBe('Inactivo');
    });
  });

  describe('cambiarEstado', () => {
    it('Activo → Inactivo', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      const resultado = await service.cambiarEstado(creado.id, 'Inactivo');

      expect(resultado.estado).toBe('Inactivo');
    });

    it('Inactivo → Activo', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      await service.cambiarEstado(creado.id, 'Inactivo');
      const resultado = await service.cambiarEstado(creado.id, 'Activo');

      expect(resultado.estado).toBe('Activo');
    });
  });

  describe('atomicidad frente a fallos de enriquecimiento físico (obtenerParaUsoInterno)', () => {
    it('crear no inserta el Formato si obtenerParaUsoInterno falla', async () => {
      archivosService.obtenerParaUsoInterno.mockRejectedValueOnce(
        new NotFoundException('Archivo no disponible.'),
      );

      await expect(service.crear(dto(), 'dev-usuario-1')).rejects.toThrow(NotFoundException);

      const listado = await service.listar();
      expect(listado).toHaveLength(0);
    });

    it('actualizar no muta ningún campo si obtenerParaUsoInterno falla', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');

      archivosService.obtenerParaUsoInterno.mockRejectedValueOnce(
        new NotFoundException('Archivo no disponible.'),
      );

      await expect(
        service.actualizar(creado.id, { nombre: 'No debe quedar' }, 'dev-usuario-1'),
      ).rejects.toThrow(NotFoundException);

      const sinCambios = await service.obtenerPorId(creado.id);
      expect(sinCambios.nombre).toBe(creado.nombre);
    });

    it('cambiarEstado no aplica la transición si obtenerParaUsoInterno falla', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');

      archivosService.obtenerParaUsoInterno.mockRejectedValueOnce(
        new NotFoundException('Archivo no disponible.'),
      );

      await expect(service.cambiarEstado(creado.id, 'Inactivo')).rejects.toThrow(NotFoundException);

      const sinCambios = await service.obtenerPorId(creado.id);
      expect(sinCambios.estado).toBe('Activo');
    });
  });

  describe('obtenerParaDescarga', () => {
    it('un Formato Activo usa exactamente el archivoId asociado', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      archivosService.obtenerParaUsoInterno.mockClear();

      await service.obtenerParaDescarga(creado.id);

      expect(archivosService.obtenerParaUsoInterno).toHaveBeenCalledWith(ARCHIVO_VALIDO.id);
    });

    it('un Formato Inactivo lanza NotFoundException', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      await service.cambiarEstado(creado.id, 'Inactivo');

      await expect(service.obtenerParaDescarga(creado.id)).rejects.toThrow(NotFoundException);
    });

    it('un id inexistente lanza NotFoundException', async () => {
      await expect(service.obtenerParaDescarga('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('copias defensivas', () => {
    it('mutar la respuesta de listar() no afecta el estado interno', async () => {
      const creado = await service.crear(dto(), 'dev-usuario-1');
      const [publicado] = await service.listar();
      publicado.nombre = 'Mutado desde fuera';

      const obtenido = await service.obtenerPorId(creado.id);
      expect(obtenido.nombre).toBe(creado.nombre);
    });
  });
});
