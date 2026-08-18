import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormatosService } from '../../services/formatos.service';
import { Formato } from '../../models/formato.model';
import { APARTADOS_FORMATOS } from '../../models/apartados-formatos';

interface GrupoFormatos {
  categoria: string;
  formatos: Formato[];
}

@Component({
  selector: 'app-formatos-page',
  imports: [DatePipe],
  templateUrl: './formatos-page.html',
  styleUrl: './formatos-page.scss',
})
export class FormatosPage {
  private readonly formatosService = inject(FormatosService);

  protected readonly formatos = signal<Formato[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  // Los 11 apartados definidos siempre se muestran, en su orden exacto,
  // incluso vacíos. Un Formato cuya categoria no coincida con ninguno se
  // agrupa en una sección adicional al final (con el nombre real recibido
  // del backend, sin inventar un "Otros"), para no perder información.
  protected readonly grupos = computed<GrupoFormatos[]>(() => {
    const porCategoria = new Map<string, Formato[]>();

    for (const apartado of APARTADOS_FORMATOS) {
      porCategoria.set(apartado, []);
    }

    const desconocidas: string[] = [];

    for (const formato of this.formatos()) {
      if (!porCategoria.has(formato.categoria)) {
        porCategoria.set(formato.categoria, []);
        desconocidas.push(formato.categoria);
      }

      porCategoria.get(formato.categoria)!.push(formato);
    }

    return [...APARTADOS_FORMATOS, ...desconocidas].map((categoria) => ({
      categoria,
      formatos: porCategoria.get(categoria) ?? [],
    }));
  });

  constructor() {
    this.cargar();
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
