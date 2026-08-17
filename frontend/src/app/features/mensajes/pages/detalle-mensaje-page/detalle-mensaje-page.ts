import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MensajesService } from '../../services/mensajes.service';
import { esMensajeRecibido, MensajeDetalle } from '../../models/mensaje.model';

@Component({
  selector: 'app-detalle-mensaje-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './detalle-mensaje-page.html',
  styleUrl: './detalle-mensaje-page.scss',
})
export class DetalleMensajePage {
  private readonly route = inject(ActivatedRoute);
  private readonly mensajesService = inject(MensajesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly detalle = signal<MensajeDetalle | null>(null);
  protected readonly avisoVisto = signal<string | null>(null);

  protected readonly esRecibido = esMensajeRecibido;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.cargando.set(false);
        this.error.set('Mensaje no especificado.');
        return;
      }

      this.cargarDetalle(id);
    });
  }

  protected urlDescarga(mensajeId: string, archivoId: string): string {
    return this.mensajesService.urlDescargaAdjunto(mensajeId, archivoId);
  }

  private cargarDetalle(id: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.avisoVisto.set(null);

    this.mensajesService.obtenerDetalle(id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
        this.marcarVistoSiCorresponde(id, detalle);
      },
      error: () => {
        this.error.set('No fue posible cargar el mensaje.');
        this.cargando.set(false);
      },
    });
  }

  private marcarVistoSiCorresponde(id: string, detalle: MensajeDetalle): void {
    if (
      !esMensajeRecibido(detalle) ||
      detalle.estado !== 'Enviado' ||
      !detalle.contenidoDisponible ||
      detalle.estadoLectura !== 'Nuevo'
    ) {
      return;
    }

    this.mensajesService.marcarVisto(id).subscribe({
      next: () => {
        this.detalle.update((actual) =>
          actual && esMensajeRecibido(actual) ? { ...actual, estadoLectura: 'Visto' } : actual,
        );
      },
      error: () => {
        this.avisoVisto.set('No fue posible actualizar el estado de lectura de este mensaje.');
      },
    });
  }
}
