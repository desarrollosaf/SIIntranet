import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly adminOnly?: boolean;
  readonly esActivo: (url: string) => boolean;
}

/**
 * Bandeja de entrada cubre todas las rutas de /mensajes/* salvo /redactar
 * (detalle, responder, editar son secundarias de la bandeja, no de
 * Mensaje nuevo) — por eso no se puede resolver con RouterLinkActive simple.
 */
const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Inicio',
    path: '/inicio',
    icon: 'bi-house',
    esActivo: (url) => url === '/inicio',
  },
  {
    label: 'Mensaje nuevo',
    path: '/mensajes/redactar',
    icon: 'bi-pencil-square',
    esActivo: (url) => url.startsWith('/mensajes/redactar'),
  },
  {
    label: 'Bandeja de entrada',
    path: '/mensajes/recibidos',
    icon: 'bi-inbox',
    esActivo: (url) => url.startsWith('/mensajes') && !url.startsWith('/mensajes/redactar'),
  },
  {
    label: 'Formatos',
    path: '/formatos',
    icon: 'bi-folder2-open',
    esActivo: (url) => url.startsWith('/formatos'),
  },
  {
    label: 'Administración',
    path: '/administracion/usuarios',
    icon: 'bi-people',
    adminOnly: true,
    esActivo: (url) => url.startsWith('/administracion'),
  },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('botonMenu') private readonly botonMenuRef?: ElementRef<HTMLButtonElement>;

  protected readonly currentUser = this.authService.currentUser;
  protected readonly menuAbierto = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly navItemsVisibles = computed<NavItem[]>(() => {
    const esAdministrador = this.currentUser()?.rol === 'Administrador';
    return NAV_ITEMS.filter((item) => !item.adminOnly || esAdministrador);
  });

  // Agrupación puramente visual (ver ETAPA 15B-R) sobre la misma lista ya
  // filtrada por rol — navItemsVisibles() no cambia de significado ni de uso
  // en el resto del componente/tests.
  protected readonly navPrincipal = computed<NavItem[]>(() =>
    this.navItemsVisibles().filter((item) => !item.adminOnly),
  );

  protected readonly navAdministracion = computed<NavItem[]>(() =>
    this.navItemsVisibles().filter((item) => item.adminOnly === true),
  );

  protected esActivo(item: NavItem): boolean {
    return item.esActivo(this.currentUrl());
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected alternarMenu(): void {
    if (this.menuAbierto()) {
      this.cerrarMenu();
    } else {
      this.menuAbierto.set(true);
    }
  }

  protected cerrarMenu(): void {
    const estabaAbierto = this.menuAbierto();
    this.menuAbierto.set(false);

    if (estabaAbierto) {
      this.botonMenuRef?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cerrarMenu();
  }
}
