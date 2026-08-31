import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormatosService } from '../../services/formatos.service';
import { Formato } from '../../models/formato.model';
import { APARTADOS_FORMATOS } from '../../models/apartados-formatos';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

interface GrupoFormatos {
  categoria: string;
  formatos: Formato[];
}

@Component({
  selector: 'app-formatos-page',
  imports: [DatePipe, PageHero],
  templateUrl: './formatos-page.html',
  styleUrl: './formatos-page.scss',
})
export class FormatosPage {
  private readonly formatosService = inject(FormatosService);

  protected readonly formatos = signal<Formato[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly terminoBusqueda = signal('');

  protected readonly totalFormatos = computed(() => this.formatos().length);

  protected readonly hayBusqueda = computed(() => this.normalizarTexto(this.terminoBusqueda()).length > 0);

  // Filtro completamente local sobre los Formato ya obtenidos — sin nueva
  // petición al backend. Se filtra sobre this.formatos() (nunca se muta).
  protected readonly formatosFiltrados = computed<Formato[]>(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());

    if (!termino) {
      return this.formatos();
    }

    return this.formatos().filter((formato) => this.coincide(formato, termino));
  });

  // Los 11 apartados oficiales se usan como orden de referencia, pero solo
  // se presentan los que tengan al menos un formato (visible tras la
  // búsqueda) — ETAPA 15C.4 cambia deliberadamente la presentación de
  // categorías vacías, no el catálogo (APARTADOS_FORMATOS no se modifica).
  // Una categoria del backend que no coincida con ninguna de las 11 se
  // agrupa en una sección adicional al final (con el nombre real recibido),
  // igual que antes.
  protected readonly grupos = computed<GrupoFormatos[]>(() => {
    const porCategoria = new Map<string, Formato[]>();
    const desconocidas: string[] = [];
    const catalogadas: readonly string[] = APARTADOS_FORMATOS;

    for (const formato of this.formatosFiltrados()) {
      if (!porCategoria.has(formato.categoria)) {
        porCategoria.set(formato.categoria, []);

        if (!catalogadas.includes(formato.categoria)) {
          desconocidas.push(formato.categoria);
        }
      }

      porCategoria.get(formato.categoria)!.push(formato);
    }

    return [...APARTADOS_FORMATOS, ...desconocidas]
      .map((categoria) => ({ categoria, formatos: porCategoria.get(categoria) ?? [] }))
      .filter((grupo) => grupo.formatos.length > 0);
  });

  protected readonly resumenGlobal = computed(() => {
    const cantidad = this.formatosFiltrados().length;
    const sustantivo = cantidad === 1 ? 'formato' : 'formatos';
    const sufijo = this.hayBusqueda()
      ? cantidad === 1
        ? 'encontrado'
        : 'encontrados'
      : cantidad === 1
        ? 'disponible'
        : 'disponibles';

    return `${cantidad} ${sustantivo} ${sufijo}`;
  });

  constructor() {
    this.cargar();
  }

  protected onBuscar(event: Event): void {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value);
  }

  protected contadorCategoria(cantidad: number): string {
    return cantidad === 1 ? '1 formato' : `${cantidad} formatos`;
  }

  protected urlDescarga(id: string): string {
    return this.formatosService.urlDescarga(id);
  }

  protected tamanoLegible(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private coincide(formato: Formato, termino: string): boolean {
    return (
      this.normalizarTexto(formato.nombre).includes(termino) ||
      this.normalizarTexto(formato.descripcion).includes(termino) ||
      this.normalizarTexto(formato.archivo.nombreOriginal).includes(termino) ||
      this.normalizarTexto(formato.categoria).includes(termino)
    );
  }

  private normalizarTexto(texto: string): string {
    return texto.trim().toLocaleLowerCase();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.formatosService.listar().subscribe({
      next: (formatos) => {
        this.formatos.set(formatos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar los formatos.');
        this.cargando.set(false);
      },
    });
  }
}
