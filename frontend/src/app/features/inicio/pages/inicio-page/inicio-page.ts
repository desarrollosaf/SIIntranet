import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { MensajesService } from '../../../mensajes/services/mensajes.service';
import { MensajeRecibido } from '../../../mensajes/models/mensaje.model';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { ENLACES_INSTITUCIONALES } from '../../models/enlaces-institucionales';

interface AccesoRapido {
  readonly label: string;
  readonly descripcion: string;
  readonly path: string;
  readonly icon: string;
  readonly adminOnly?: boolean;
}

const MAXIMO_MENSAJES_RECIENTES = 5;

const ACCESOS_RAPIDOS: readonly AccesoRapido[] = [
  {
    label: 'Mensaje nuevo',
    descripcion: 'Redactar un mensaje',
    path: '/mensajes/redactar',
    icon: 'bi-pencil-square',
  },
  {
    label: 'Bandeja de entrada',
    descripcion: 'Consultar mensajes recibidos',
    path: '/mensajes/recibidos',
    icon: 'bi-inbox',
  },
  {
    label: 'Formatos',
    descripcion: 'Consultar documentos institucionales',
    path: '/formatos',
    icon: 'bi-folder2-open',
  },
  {
    label: 'Administración',
    descripcion: 'Gestionar usuarios del sistema',
    path: '/administracion/usuarios',
    icon: 'bi-people',
    adminOnly: true,
  },
];

@Component({
  selector: 'app-inicio-page',
  imports: [PageHero, RouterLink, DatePipe],
  templateUrl: './inicio-page.html',
  styleUrl: './inicio-page.scss',
})
export class InicioPage {
  private readonly authService = inject(AuthService);
  private readonly mensajesService = inject(MensajesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly enlaces = ENLACES_INSTITUCIONALES;

  protected readonly accesosVisibles = computed<AccesoRapido[]>(() => {
    const esAdministrador = this.currentUser()?.rol === 'Administrador';
    return ACCESOS_RAPIDOS.filter((acceso) => !acceso.adminOnly || esAdministrador);
  });

  protected readonly mensajesRecientes = signal<MensajeRecibido[]>([]);
  protected readonly cargandoMensajes = signal(true);
  protected readonly errorMensajes = signal<string | null>(null);

  constructor() {
    this.mensajesService
      .recibidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mensajes) => {
          this.mensajesRecientes.set(
            this.ordenarPorFechaDescendente(mensajes).slice(0, MAXIMO_MENSAJES_RECIENTES),
          );
          this.cargandoMensajes.set(false);
        },
        error: () => {
          this.errorMensajes.set('No fue posible cargar los mensajes recientes.');
          this.cargandoMensajes.set(false);
        },
      });
  }

  // No se garantiza orden en GET /mensajes/recibidos (backend/src/modules/
  // mensajes/mensajes.service.ts no aplica sort) — se ordena aquí sobre una
  // copia, sin mutar el arreglo recibido.
  private ordenarPorFechaDescendente(mensajes: MensajeRecibido[]): MensajeRecibido[] {
    return [...mensajes].sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime(),
    );
  }
}
