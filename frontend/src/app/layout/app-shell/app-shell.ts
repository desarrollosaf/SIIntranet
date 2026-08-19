import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
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

const CONECTORES_IGNORADOS = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

/**
 * Iniciales para el botón de cuenta, derivadas exclusivamente de
 * CurrentUser.nombre. Máximo 2 caracteres, resultado estable — no es un
 * contrato formal, solo una presentación visual razonable.
 */
function obtenerIniciales(nombre: string): string {
  const terminos = nombre
    .trim()
    .split(/\s+/)
    .filter((termino) => termino.length > 0 && !CONECTORES_IGNORADOS.has(termino.toLowerCase()));

  if (terminos.length === 0) {
    return 'U';
  }

  if (terminos.length === 1) {
    return terminos[0].charAt(0).toUpperCase();
  }

  return (terminos[0].charAt(0) + terminos[1].charAt(0)).toUpperCase();
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('botonMenu') private readonly botonMenuRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('botonCuenta') private readonly botonCuentaRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panelCuenta') private readonly panelCuentaRef?: ElementRef<HTMLElement>;

  protected readonly currentUser = this.authService.currentUser;

  // Tres capas de UI independientes entre sí (ver MICROCORRECCIÓN 15B.1):
  // sidebar de escritorio (layout push/collapse, no modal), drawer móvil
  // (overlay modal) y menú de cuenta (dropdown anclado, no modal).
  protected readonly menuAbierto = signal(false);
  protected readonly sidebarColapsado = signal(false);
  protected readonly menuUsuarioAbierto = signal(false);

  protected readonly iniciales = computed(() => {
    const usuario = this.currentUser();
    return usuario ? obtenerIniciales(usuario.nombre) : 'U';
  });

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

  protected alternarSidebar(): void {
    this.sidebarColapsado.update((colapsado) => !colapsado);
  }

  protected alternarMenu(): void {
    if (this.menuAbierto()) {
      this.cerrarMenu();
      return;
    }

    this.menuAbierto.set(true);
    // El drawer es modal en móvil: evita que el contenido detrás se
    // desplace mientras está abierto. Se revierte al cerrar/destruir.
    document.body.style.overflow = 'hidden';

    // Una sola capa interactiva a la vez.
    this.menuUsuarioAbierto.set(false);
  }

  protected cerrarMenu(): void {
    const estabaAbierto = this.menuAbierto();
    this.menuAbierto.set(false);
    document.body.style.overflow = '';

    if (estabaAbierto) {
      this.botonMenuRef?.nativeElement.focus();
    }
  }

  protected alternarMenuUsuario(): void {
    if (this.menuUsuarioAbierto()) {
      this.cerrarMenuUsuario();
      return;
    }

    this.menuUsuarioAbierto.set(true);

    // Una sola capa interactiva a la vez.
    if (this.menuAbierto()) {
      this.menuAbierto.set(false);
      document.body.style.overflow = '';
    }
  }

  protected cerrarMenuUsuario(): void {
    const estabaAbierto = this.menuUsuarioAbierto();
    this.menuUsuarioAbierto.set(false);

    if (estabaAbierto) {
      this.botonCuentaRef?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cerrarMenuUsuario();
    this.cerrarMenu();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuUsuarioAbierto()) {
      return;
    }

    const objetivo = event.target as Node;
    const dentroDelBoton = this.botonCuentaRef?.nativeElement.contains(objetivo) ?? false;
    const dentroDelPanel = this.panelCuentaRef?.nativeElement.contains(objetivo) ?? false;

    if (!dentroDelBoton && !dentroDelPanel) {
      this.cerrarMenuUsuario();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
