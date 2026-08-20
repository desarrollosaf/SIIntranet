import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MensajesService } from '../../services/mensajes.service';
import { MensajeEnviado, MensajeRecibido } from '../../models/mensaje.model';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

type TipoBandeja = 'recibidos' | 'enviados';

const MAXIMO_DESTINATARIOS_VISIBLES = 2;

@Component({
  selector: 'app-bandeja-mensajes-page',
  imports: [RouterLink, DatePipe, PageHero],
  templateUrl: './bandeja-mensajes-page.html',
  styleUrl: './bandeja-mensajes-page.scss',
})
export class BandejaMensajesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly mensajesService = inject(MensajesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tipo = signal<TipoBandeja>('recibidos');
  protected readonly recibidos = signal<MensajeRecibido[]>([]);
  protected readonly enviados = signal<MensajeEnviado[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly terminoBusqueda = signal('');

  protected readonly recibidosFiltrados = computed<MensajeRecibido[]>(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());

    if (!termino) {
      return this.recibidos();
    }

    return this.recibidos().filter((mensaje) => this.coincideRecibido(mensaje, termino));
  });

  protected readonly enviadosFiltrados = computed<MensajeEnviado[]>(() => {
    const termino = this.normalizarTexto(this.terminoBusqueda());

    if (!termino) {
      return this.enviados();
    }

    return this.enviados().filter((mensaje) => this.coincideEnviado(mensaje, termino));
  });

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const tipo = (data['tipo'] as TipoBandeja | undefined) ?? 'recibidos';
      this.tipo.set(tipo);
      this.cargar(tipo);
    });
  }

  protected onBuscar(event: Event): void {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value);
  }

  protected nombresDestinatarios(mensaje: MensajeEnviado): string {
    const nombres = mensaje.destinatarios.map((d) => d.nombre);

    if (nombres.length <= MAXIMO_DESTINATARIOS_VISIBLES) {
      return nombres.join(', ');
    }

    const visibles = nombres.slice(0, MAXIMO_DESTINATARIOS_VISIBLES).join(', ');
    const restantes = nombres.length - MAXIMO_DESTINATARIOS_VISIBLES;
    return `${visibles} y ${restantes} más`;
  }

  private coincideRecibido(mensaje: MensajeRecibido, termino: string): boolean {
    if (mensaje.contenidoDisponible && this.normalizarTexto(mensaje.titulo ?? '').includes(termino)) {
      return true;
    }

    return (
      this.normalizarTexto(mensaje.remitente.nombre).includes(termino) ||
      this.normalizarTexto(mensaje.remitente.usuario).includes(termino)
    );
  }

  private coincideEnviado(mensaje: MensajeEnviado, termino: string): boolean {
    if (mensaje.contenidoDisponible && this.normalizarTexto(mensaje.titulo ?? '').includes(termino)) {
      return true;
    }

    return mensaje.destinatarios.some(
      (destinatario) =>
        this.normalizarTexto(destinatario.nombre).includes(termino) ||
        this.normalizarTexto(destinatario.usuario).includes(termino),
    );
  }

  private normalizarTexto(texto: string): string {
    return texto.trim().toLowerCase();
  }

  // El backend no garantiza orden (ver backend/src/modules/mensajes/
  // mensajes.service.ts, sin sort) — se ordena aquí sobre una copia, sin
  // mutar el arreglo recibido. Mismo criterio ya aprobado en Inicio.
  private ordenarPorFechaDescendente<T extends { fechaCreacion: string }>(mensajes: T[]): T[] {
    return [...mensajes].sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime(),
    );
  }

  private cargar(tipo: TipoBandeja): void {
    this.cargando.set(true);
    this.error.set(null);

    if (tipo === 'recibidos') {
      this.mensajesService.recibidos().subscribe({
        next: (mensajes) => {
          this.recibidos.set(this.ordenarPorFechaDescendente(mensajes));
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No fue posible cargar los mensajes.');
          this.cargando.set(false);
        },
      });
      return;
    }

    this.mensajesService.enviados().subscribe({
      next: (mensajes) => {
        this.enviados.set(this.ordenarPorFechaDescendente(mensajes));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar los mensajes.');
        this.cargando.set(false);
      },
    });
  }
}
