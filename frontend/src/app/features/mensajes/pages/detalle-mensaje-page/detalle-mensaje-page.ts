import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MensajesService } from '../../services/mensajes.service';
import { esMensajeRecibido, MensajeDetalle, MensajeEnviado } from '../../models/mensaje.model';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

interface InfoVolver {
  readonly texto: string;
  readonly ruta: string;
}

@Component({
  selector: 'app-detalle-mensaje-page',
  imports: [RouterLink, DatePipe, PageHero],
  templateUrl: './detalle-mensaje-page.html',
  styleUrl: './detalle-mensaje-page.scss',
})
export class DetalleMensajePage {
  private readonly route = inject(ActivatedRoute);
  private readonly mensajesService = inject(MensajesService);
  private readonly destroyRef = inject(DestroyRef);
  private carga?: Subscription;
  private lectura?: Subscription;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly detalle = signal<MensajeDetalle | null>(null);
  protected readonly avisoVisto = signal<string | null>(null);

  protected readonly procesandoAccion = signal(false);
  protected readonly errorAccion = signal<string | null>(null);

  protected readonly esRecibido = esMensajeRecibido;

  private readonly origen = this.route.snapshot.queryParamMap.get('origen');

  protected readonly volver = computed<InfoVolver>(() => {
    if (this.origen === 'recibidos') {
      return { texto: 'Volver a recibidos', ruta: '/mensajes/recibidos' };
    }

    if (this.origen === 'enviados') {
      return { texto: 'Volver a enviados', ruta: '/mensajes/enviados' };
    }

    const mensaje = this.detalle();

    if (mensaje && !this.esRecibido(mensaje)) {
      return { texto: 'Volver a enviados', ruta: '/mensajes/enviados' };
    }

    return { texto: 'Volver a recibidos', ruta: '/mensajes/recibidos' };
  });

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

  protected esEditable(mensaje: MensajeEnviado): boolean {
    return (
      mensaje.estado === 'Enviado' &&
      mensaje.destinatarios.every((d) => d.estadoLectura === 'Nuevo')
    );
  }

  protected onCancelar(mensajeId: string): void {
    if (this.procesandoAccion()) {
      return;
    }

    this.procesandoAccion.set(true);
    this.errorAccion.set(null);

    this.mensajesService.cancelar(mensajeId).subscribe({
      next: () => this.recargarTrasAccion(mensajeId),
      error: () => {
        this.errorAccion.set('No fue posible cancelar el mensaje.');
        this.procesandoAccion.set(false);
      },
    });
  }

  protected onEliminar(mensajeId: string): void {
    if (this.procesandoAccion()) {
      return;
    }

    if (!confirm('¿Deseas eliminar este mensaje?')) {
      return;
    }

    this.procesandoAccion.set(true);
    this.errorAccion.set(null);

    this.mensajesService.eliminar(mensajeId).subscribe({
      next: () => this.recargarTrasAccion(mensajeId),
      error: () => {
        this.errorAccion.set('No fue posible eliminar el mensaje.');
        this.procesandoAccion.set(false);
      },
    });
  }

  private recargarTrasAccion(mensajeId: string): void {
    this.mensajesService.obtenerDetalle(mensajeId).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.procesandoAccion.set(false);
      },
      error: () => {
        this.errorAccion.set('No fue posible actualizar el mensaje.');
        this.procesandoAccion.set(false);
      },
    });
  }

  private cargarDetalle(id: string): void {
    this.carga?.unsubscribe();
    this.lectura?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.avisoVisto.set(null);
    this.detalle.set(null);
    this.errorAccion.set(null);

    this.carga = this.mensajesService
      .obtenerDetalle(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

    this.lectura = this.mensajesService
      .marcarVisto(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.detalle.update((actual) =>
            actual?.id === id && esMensajeRecibido(actual)
              ? { ...actual, estadoLectura: 'Visto' }
              : actual,
          );
        },
        error: () => {
          this.avisoVisto.set('No fue posible actualizar el estado de lectura de este mensaje.');
        },
      });
  }
}
