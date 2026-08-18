import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { FormatosPage } from './formatos-page';
import { FormatosService } from '../../services/formatos.service';
import { Formato } from '../../models/formato.model';
import { APARTADOS_FORMATOS } from '../../models/apartados-formatos';

describe('FormatosPage', () => {
  let fixture: ComponentFixture<FormatosPage>;
  let formatosService: FormatosService;

  function archivo(overrides: Partial<Formato['archivo']> = {}): Formato['archivo'] {
    return {
      id: 'archivo-1',
      nombreOriginal: 'documento.pdf',
      mimeType: 'application/pdf',
      tamano: 1024,
      fechaSubida: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  function formato(overrides: Partial<Formato> = {}): Formato {
    return {
      id: 'formato-1',
      nombre: 'Solicitud de vacaciones',
      descripcion: 'Formato para solicitar días de vacaciones',
      categoria: 'Dirección de Informática',
      fechaCreacion: '2026-01-01T00:00:00.000Z',
      estado: 'Activo',
      archivo: archivo(),
      ...overrides,
    };
  }

  // La carga se dispara desde el constructor, así que FormatosService.listar
  // debe estar espiado antes de crear el fixture.
  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [FormatosPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    formatosService = TestBed.inject(FormatosService);
  }

  function crearFixture(): void {
    fixture = TestBed.createComponent(FormatosPage);
  }

  it('crea el componente', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('llama a FormatosService.listar() al cargar', () => {
    configurar();
    const spy = vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  it('muestra un estado de carga mientras la petición está pendiente', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(new Subject<Formato[]>());
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cargando formatos');
  });

  it('muestra un error accesible si la carga falla', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No fue posible cargar los formatos.');
    expect(compiled.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('con backend [] se renderizan los 11 apartados definidos', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    expect(grupos).toHaveLength(APARTADOS_FORMATOS.length);
    expect(grupos.map((g) => g.categoria)).toEqual([...APARTADOS_FORMATOS]);
  });

  it('cada apartado vacío muestra el mensaje de estado vacío', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const mensajesVacios = compiled.querySelectorAll('.formatos-page__categoria p.text-muted.small');
    expect(mensajesVacios.length).toBe(APARTADOS_FORMATOS.length);
    mensajesVacios.forEach((p) => expect(p.textContent).toContain('Aún no hay formatos disponibles.'));
  });

  it('respeta el orden exacto de los 11 apartados, incluso con documentos', () => {
    configurar();
    const formatos = [
      formato({ id: 'formato-1', categoria: 'Dirección de Informática' }),
      formato({ id: 'formato-2', categoria: 'Formatos' }),
    ];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    expect(grupos.slice(0, APARTADOS_FORMATOS.length).map((g) => g.categoria)).toEqual([
      ...APARTADOS_FORMATOS,
    ]);
  });

  it('dos documentos de la misma categoría aparecen dentro de su apartado correcto', () => {
    configurar();
    const formatos = [
      formato({ id: 'formato-1', categoria: 'Dirección de Finanzas' }),
      formato({ id: 'formato-2', categoria: 'Dirección de Finanzas', nombre: 'Otro formato' }),
    ];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    const apartado = grupos.find((g) => g.categoria === 'Dirección de Finanzas');
    expect(apartado?.formatos).toHaveLength(2);
    expect(apartado?.formatos.map((f) => f.id)).toEqual(['formato-1', 'formato-2']);
  });

  it('documentos de dos apartados distintos se separan correctamente', () => {
    configurar();
    const formatos = [
      formato({ id: 'formato-1', categoria: 'Dirección de Finanzas' }),
      formato({ id: 'formato-2', categoria: 'Dirección de Informática' }),
    ];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    const finanzas = grupos.find((g) => g.categoria === 'Dirección de Finanzas');
    const informatica = grupos.find((g) => g.categoria === 'Dirección de Informática');

    expect(finanzas?.formatos.map((f) => f.id)).toEqual(['formato-1']);
    expect(informatica?.formatos.map((f) => f.id)).toEqual(['formato-2']);
  });

  it('una categoría desconocida del backend aparece al final con su nombre real', () => {
    configurar();
    const formatos = [formato({ id: 'formato-1', categoria: 'Categoría no catalogada' })];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    const ultimo = grupos[grupos.length - 1];

    expect(grupos).toHaveLength(APARTADOS_FORMATOS.length + 1);
    expect(ultimo.categoria).toBe('Categoría no catalogada');
    expect(ultimo.formatos.map((f) => f.id)).toEqual(['formato-1']);
  });

  it('una categoría desconocida NO reemplaza ni reordena los 11 apartados', () => {
    configurar();
    const formatos = [formato({ id: 'formato-1', categoria: 'Categoría no catalogada' })];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    expect(grupos.slice(0, APARTADOS_FORMATOS.length).map((g) => g.categoria)).toEqual([
      ...APARTADOS_FORMATOS,
    ]);
  });

  it('muestra nombre, descripción, nombre original del archivo, tamaño y fecha', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([formato()]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Solicitud de vacaciones');
    expect(compiled.textContent).toContain('Formato para solicitar días de vacaciones');
    expect(compiled.textContent).toContain('documento.pdf');
    expect(compiled.textContent).toContain('1.0 KB');
  });

  it('el enlace de descarga apunta a /api/formatos/:id/descarga', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([formato({ id: 'formato-1' })]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlace = compiled.querySelector('a[href*="descarga"]') as HTMLAnchorElement | null;

    expect(enlace).toBeTruthy();
    expect(enlace!.getAttribute('href')).toBe(formatosService.urlDescarga('formato-1'));
  });

  describe('tamanoLegible', () => {
    beforeEach(() => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
      crearFixture();
      fixture.detectChanges();
    });

    it('formatea bytes menores a 1024 en B', () => {
      expect(fixture.componentInstance['tamanoLegible'](850)).toBe('850 B');
    });

    it('formatea bytes menores a 1 MiB en KB', () => {
      expect(fixture.componentInstance['tamanoLegible'](25088)).toBe('24.5 KB');
    });

    it('formatea bytes desde 1 MiB en MB', () => {
      expect(fixture.componentInstance['tamanoLegible'](2202010)).toBe('2.1 MB');
    });
  });
});
