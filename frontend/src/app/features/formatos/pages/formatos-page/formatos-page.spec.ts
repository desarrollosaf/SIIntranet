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

  function buscar(termino: string): void {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#buscador-formatos') as HTMLInputElement;
    input.value = termino;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  // 1. creación
  it('crea el componente', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  // 2. listar()
  it('llama a FormatosService.listar() al cargar', () => {
    configurar();
    const spy = vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  // 3. PageHero/único h1
  it('el hero muestra "Formatos" como único h1', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('h1').length).toBe(1);
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Formatos');
  });

  // 4. loading
  it('muestra un estado de carga mientras la petición está pendiente', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(new Subject<Formato[]>());
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cargando formatos');
  });

  // 5. error role=alert
  it('muestra un error accesible si la carga falla', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(throwError(() => new Error('falla')));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No fue posible cargar los formatos.');
    expect(compiled.querySelector('[role="alert"]')).toBeTruthy();
  });

  // 6 y 7. backend [] → un solo estado vacío global, sin los 11 mensajes repetidos
  it('con backend [] muestra un único estado vacío global y ninguna categoría', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const mensajesVacios = Array.from(compiled.querySelectorAll('p')).filter(
      (p) => p.textContent?.trim() === 'No hay formatos disponibles actualmente.',
    );

    expect(mensajesVacios).toHaveLength(1);
    expect(compiled.querySelectorAll('.formatos-page__categoria')).toHaveLength(0);
    expect(compiled.textContent).not.toContain('Aún no hay formatos disponibles.');
  });

  // 8. categoría con contenido visible
  it('una categoría con documentos se muestra con su nombre', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([formato({ categoria: 'Dirección de Finanzas' })]),
    );
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dirección de Finanzas');
  });

  // 9. categoría vacía oculta
  it('una categoría del catálogo sin documentos no se renderiza', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([formato({ categoria: 'Dirección de Finanzas' })]),
    );
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    expect(grupos.map((g) => g.categoria)).not.toContain('Coordinación de Normatividad');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Coordinación de Normatividad');
  });

  // 10. múltiples categorías con contenido mantienen orden oficial
  it('varias categorías con contenido conservan el orden oficial de APARTADOS_FORMATOS', () => {
    configurar();
    const formatos = [
      formato({ id: 'f-1', categoria: 'Dirección de Informática' }),
      formato({ id: 'f-2', categoria: 'Formatos' }),
      formato({ id: 'f-3', categoria: 'Dirección de Finanzas' }),
    ];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    const indiceOficial = (categoria: string) => APARTADOS_FORMATOS.indexOf(categoria as (typeof APARTADOS_FORMATOS)[number]);

    const indices = grupos.map((g) => indiceOficial(g.categoria));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(grupos.map((g) => g.categoria)).toEqual([
      'Formatos',
      'Dirección de Finanzas',
      'Dirección de Informática',
    ]);
  });

  // 11. desconocida con contenido aparece al final
  it('una categoría desconocida del backend aparece al final con su nombre real', () => {
    configurar();
    const formatos = [
      formato({ id: 'f-1', categoria: 'Dirección de Informática' }),
      formato({ id: 'f-2', categoria: 'Categoría no catalogada' }),
    ];
    vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatos));
    crearFixture();

    fixture.detectChanges();

    const grupos = fixture.componentInstance['grupos']();
    expect(grupos[grupos.length - 1].categoria).toBe('Categoría no catalogada');
    expect(grupos[grupos.length - 1].formatos.map((f) => f.id)).toEqual(['f-2']);
  });

  describe('búsqueda', () => {
    function formatosDeMuestra(): Formato[] {
      return [
        formato({
          id: 'f-1',
          nombre: 'Solicitud de vacaciones',
          descripcion: 'Formato para solicitar días',
          categoria: 'Dirección de Finanzas',
          archivo: archivo({ nombreOriginal: 'vacaciones.pdf' }),
        }),
        formato({
          id: 'f-2',
          nombre: 'Constancia laboral',
          descripcion: 'Documento de constancia',
          categoria: 'Dirección de Informática',
          archivo: archivo({ nombreOriginal: 'constancia.pdf' }),
        }),
      ];
    }

    // 12. búsqueda por nombre
    it('filtra por nombre', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('vacaciones');

      const grupos = fixture.componentInstance['grupos']();
      const ids = grupos.flatMap((g) => g.formatos.map((f) => f.id));
      expect(ids).toEqual(['f-1']);
    });

    // 13. búsqueda por descripción
    it('filtra por descripción', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('Documento de');

      const grupos = fixture.componentInstance['grupos']();
      const ids = grupos.flatMap((g) => g.formatos.map((f) => f.id));
      expect(ids).toEqual(['f-2']);
    });

    // 14. búsqueda por nombreOriginal
    it('filtra por nombre original del archivo', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('vacaciones.pdf');

      const grupos = fixture.componentInstance['grupos']();
      const ids = grupos.flatMap((g) => g.formatos.map((f) => f.id));
      expect(ids).toEqual(['f-1']);
    });

    // 15. búsqueda por categoria
    it('filtra por categoría', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('Dirección de Informática');

      const grupos = fixture.componentInstance['grupos']();
      const ids = grupos.flatMap((g) => g.formatos.map((f) => f.id));
      expect(ids).toEqual(['f-2']);
    });

    // 16. case-insensitive
    it('la búsqueda es insensible a mayúsculas/minúsculas', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('VACACIONES');

      const grupos = fixture.componentInstance['grupos']();
      const ids = grupos.flatMap((g) => g.formatos.map((f) => f.id));
      expect(ids).toEqual(['f-1']);
    });

    // 17. trim
    it('ignora espacios al inicio/final del término de búsqueda', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('   vacaciones   ');

      const grupos = fixture.componentInstance['grupos']();
      const ids = grupos.flatMap((g) => g.formatos.map((f) => f.id));
      expect(ids).toEqual(['f-1']);
    });

    // 18. sin resultados
    it('muestra un mensaje específico cuando la búsqueda no tiene resultados', () => {
      configurar();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(formatosDeMuestra()));
      crearFixture();
      fixture.detectChanges();

      buscar('término que no existe en ningún formato');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No se encontraron formatos que coincidan con tu búsqueda.');
      expect(fixture.componentInstance['grupos']()).toHaveLength(0);
    });

    // 19. no muta la fuente original
    it('la búsqueda no muta los formatos originales', () => {
      configurar();
      const originales = formatosDeMuestra();
      vi.spyOn(formatosService, 'listar').mockReturnValue(of(originales));
      crearFixture();
      fixture.detectChanges();

      buscar('vacaciones');
      buscar('');

      expect(fixture.componentInstance['formatos']()).toEqual(originales);
      expect(fixture.componentInstance['formatos']()).toHaveLength(2);
    });
  });

  // 20 y 21. contador por categoría — singular
  it('muestra "1 formato" cuando la categoría tiene un solo documento', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([formato({ categoria: 'Dirección de Finanzas' })]),
    );
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1 formato');
    expect(compiled.textContent).not.toContain('1 formatos');
  });

  // 22. contador por categoría — plural
  it('muestra "N formatos" cuando la categoría tiene varios documentos', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([
        formato({ id: 'f-1', categoria: 'Dirección de Finanzas' }),
        formato({ id: 'f-2', categoria: 'Dirección de Finanzas', nombre: 'Otro formato' }),
      ]),
    );
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2 formatos');
  });

  // 23. contador global
  it('muestra un resumen global con el total de formatos disponibles', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([
        formato({ id: 'f-1', categoria: 'Dirección de Finanzas' }),
        formato({ id: 'f-2', categoria: 'Dirección de Informática' }),
      ]),
    );
    crearFixture();

    fixture.detectChanges();

    expect(fixture.componentInstance['resumenGlobal']()).toBe('2 formatos disponibles');
  });

  it('el resumen global cambia a "encontrados" cuando hay una búsqueda activa', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([
        formato({ id: 'f-1', nombre: 'Solicitud de vacaciones', categoria: 'Dirección de Finanzas' }),
        formato({
          id: 'f-2',
          nombre: 'Constancia laboral',
          descripcion: 'Documento de constancia',
          categoria: 'Dirección de Informática',
        }),
      ]),
    );
    crearFixture();
    fixture.detectChanges();

    buscar('vacaciones');

    expect(fixture.componentInstance['resumenGlobal']()).toBe('1 formato encontrado');
  });

  // 24. contenido del formato
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

  // 25. tamanoLegible
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

  // 26 y 27. URL de descarga / anchor real
  it('el enlace de descarga apunta a /api/formatos/:id/descarga mediante un anchor real', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(of([formato({ id: 'formato-1' })]));
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlace = compiled.querySelector('a.formatos-page__descarga') as HTMLAnchorElement | null;

    expect(enlace).toBeTruthy();
    expect(enlace!.tagName).toBe('A');
    expect(enlace!.getAttribute('href')).toBe(formatosService.urlDescarga('formato-1'));
  });

  // 28. aria-labelledby en secciones
  it('cada sección de categoría está enlazada a su h2 mediante aria-labelledby', () => {
    configurar();
    vi.spyOn(formatosService, 'listar').mockReturnValue(
      of([formato({ categoria: 'Dirección de Finanzas' })]),
    );
    crearFixture();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const seccion = compiled.querySelector('.formatos-page__categoria') as HTMLElement;
    const idReferenciado = seccion.getAttribute('aria-labelledby');

    expect(idReferenciado).toBeTruthy();
    const encabezado = compiled.querySelector(`#${idReferenciado}`);
    expect(encabezado?.tagName).toBe('H2');
    expect(encabezado?.textContent?.trim()).toBe('Dirección de Finanzas');
  });
});
