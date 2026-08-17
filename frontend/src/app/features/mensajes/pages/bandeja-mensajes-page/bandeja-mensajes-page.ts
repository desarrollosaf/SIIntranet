import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MensajesService } from '../../services/mensajes.service';
import { MensajeEnviado, MensajeRecibido } from '../../models/mensaje.model';

type TipoBandeja = 'recibidos' | 'enviados';

@Component({
  selector: 'app-bandeja-mensajes-page',
  imports: [RouterLink, DatePipe],
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

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const tipo = (data['tipo'] as TipoBandeja | undefined) ?? 'recibidos';
      this.tipo.set(tipo);
      this.cargar(tipo);
    });
  }

  protected nombresDestinatarios(mensaje: MensajeEnviado): string {
    return mensaje.destinatarios.map((d) => d.nombre).join(', ');
  }

  private cargar(tipo: TipoBandeja): void {
    this.cargando.set(true);
    this.error.set(null);

    if (tipo === 'recibidos') {
      this.mensajesService.recibidos().subscribe({
        next: (mensajes) => {
          this.recibidos.set(mensajes);
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
        this.enviados.set(mensajes);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar los mensajes.');
        this.cargando.set(false);
      },
    });
  }
}
