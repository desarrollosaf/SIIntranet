import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { AppShell } from './app-shell';
import { AuthService } from '../../core/auth/auth.service';
import { CurrentUser } from '../../core/models/current-user.model';

// Ruta comodín que permite navegar a cualquier URL en las pruebas (incluida
// la simulación de rutas internas de mensajería) sin registrar cada página
// real — solo necesitamos que Router dispare NavigationEnd.
@Component({ selector: 'app-dummy-test-page', template: '' })
class DummyTestPage {}

describe('AppShell', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;
  let authService: AuthService;
  let router: Router;

  function establecerSesion(currentUser: CurrentUser): void {
    (authService as any).currentUserSignal.set(currentUser);
  }

  function enlaces(): HTMLAnchorElement[] {
    const compiled = fixture.nativeElement as HTMLElement;
    return Array.from(compiled.querySelectorAll('a'));
  }

  function textosDeEnlaces(): (string | undefined)[] {
    return enlaces().map((a) => a.textContent?.trim());
  }

  function hrefsConTexto(texto: string): string[] {
    return enlaces()
      .filter((a) => a.textContent?.trim() === texto)
      .map((a) => a.getAttribute('href') ?? '');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([{ path: '**', component: DummyTestPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    establecerSesion({
      id: 'dev-usuario-2',
      nombre: 'sergio',
      usuario: 'sergio',
      rol: 'Usuario',
    });
    vi.spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(AppShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('logout limpia la sesión y navega a /login', () => {
    (component as any).onLogout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  describe('navegación por rol', () => {
    it('Usuario normal ve Inicio, Mensaje nuevo, Bandeja de entrada y Formatos, pero no Administración', () => {
      fixture.detectChanges();

      const textos = textosDeEnlaces();
      expect(textos).toContain('Inicio');
      expect(textos).toContain('Mensaje nuevo');
      expect(textos).toContain('Bandeja de entrada');
      expect(textos).toContain('Formatos');
      expect(textos).not.toContain('Administración');
    });

    it('Administrador ve además Administración', () => {
      establecerSesion({
        id: 'dev-usuario-1',
        nombre: 'admin',
        usuario: 'admin',
        rol: 'Administrador',
      });
      fixture.detectChanges();

      expect(textosDeEnlaces()).toContain('Administración');
    });

    it('el enlace "Mensajes" ya no existe', () => {
      establecerSesion({
        id: 'dev-usuario-1',
        nombre: 'admin',
        usuario: 'admin',
        rol: 'Administrador',
      });
      fixture.detectChanges();

      expect(textosDeEnlaces()).not.toContain('Mensajes');
    });
  });

  describe('rutas de los enlaces', () => {
    beforeEach(() => {
      establecerSesion({
        id: 'dev-usuario-1',
        nombre: 'admin',
        usuario: 'admin',
        rol: 'Administrador',
      });
      fixture.detectChanges();
    });

    it('Inicio apunta a /inicio', () => {
      expect(hrefsConTexto('Inicio')).toContain('/inicio');
    });

    it('Mensaje nuevo apunta a /mensajes/redactar', () => {
      expect(hrefsConTexto('Mensaje nuevo')).toContain('/mensajes/redactar');
    });

    it('Bandeja de entrada apunta a /mensajes/recibidos', () => {
      expect(hrefsConTexto('Bandeja de entrada')).toContain('/mensajes/recibidos');
    });

    it('Formatos apunta a /formatos', () => {
      expect(hrefsConTexto('Formatos')).toContain('/formatos');
    });

    it('Administración apunta a /administracion/usuarios', () => {
      expect(hrefsConTexto('Administración')).toContain('/administracion/usuarios');
    });
  });

  describe('estado activo de navegación', () => {
    it('Inicio está activo únicamente en /inicio', async () => {
      await router.navigateByUrl('/inicio');
      fixture.detectChanges();

      const grupos = component['navItemsVisibles']();
      expect(grupos.find((i) => i.label === 'Inicio')!.esActivo(router.url)).toBe(true);
      expect(grupos.find((i) => i.label === 'Bandeja de entrada')!.esActivo(router.url)).toBe(false);
    });

    it('Mensaje nuevo está activo solo en /mensajes/redactar', () => {
      const item = component['navItemsVisibles']().find((i) => i.label === 'Mensaje nuevo')!;

      expect(item.esActivo('/mensajes/redactar')).toBe(true);
      expect(item.esActivo('/mensajes/recibidos')).toBe(false);
    });

    it('Bandeja de entrada está activa en recibidos, enviados, detalle, responder y editar, pero no en redactar', () => {
      const item = component['navItemsVisibles']().find((i) => i.label === 'Bandeja de entrada')!;

      expect(item.esActivo('/mensajes/recibidos')).toBe(true);
      expect(item.esActivo('/mensajes/enviados')).toBe(true);
      expect(item.esActivo('/mensajes/abc123')).toBe(true);
      expect(item.esActivo('/mensajes/abc123/responder')).toBe(true);
      expect(item.esActivo('/mensajes/abc123/editar')).toBe(true);
      expect(item.esActivo('/mensajes/redactar')).toBe(false);
    });

    it('al navegar por la app, el enlace activo real recibe aria-current="page"', async () => {
      await router.navigateByUrl('/mensajes/enviados');
      fixture.detectChanges();

      const activo = enlaces().find((a) => a.textContent?.trim() === 'Bandeja de entrada');
      expect(activo?.getAttribute('aria-current')).toBe('page');

      const mensajeNuevo = enlaces().find((a) => a.textContent?.trim() === 'Mensaje nuevo');
      expect(mensajeNuevo?.getAttribute('aria-current')).toBeNull();
    });
  });

  describe('footer institucional', () => {
    it('muestra el texto institucional', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Poder Legislativo del Estado de México');
      expect(compiled.textContent).toContain('Secretaría de Administración y Finanzas');
    });

    it('no muestra contador de visitas', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('TOTAL DE VISITAS');
      expect(compiled.textContent?.toLowerCase()).not.toContain('visitas');
    });
  });

  describe('menú móvil (drawer)', () => {
    it('el botón de menú existe en el DOM', () => {
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-mobile-header__toggle');
      expect(boton).toBeTruthy();
    });

    it('el botón inicia con aria-expanded="false"', () => {
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-mobile-header__toggle');
      expect(boton?.getAttribute('aria-expanded')).toBe('false');
    });

    it('alternarMenu() abre y cierra el drawer', () => {
      fixture.detectChanges();

      component['alternarMenu']();
      expect(component['menuAbierto']()).toBe(true);

      component['alternarMenu']();
      expect(component['menuAbierto']()).toBe(false);
    });

    it('abrir el menú actualiza aria-expanded y la clase del drawer', () => {
      fixture.detectChanges();

      component['alternarMenu']();
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-mobile-header__toggle');
      const drawer = (fixture.nativeElement as HTMLElement).querySelector('#app-drawer');

      expect(boton?.getAttribute('aria-expanded')).toBe('true');
      expect(drawer?.classList.contains('app-drawer--abierto')).toBe(true);
    });

    it('Escape cierra el menú', () => {
      fixture.detectChanges();
      component['alternarMenu']();
      expect(component['menuAbierto']()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component['menuAbierto']()).toBe(false);
    });

    it('cerrarMenu() tras estar abierto devuelve el foco al botón de menú', () => {
      fixture.detectChanges();
      const boton: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector(
        '.app-mobile-header__toggle',
      )!;
      const spyFocus = vi.spyOn(boton, 'focus');

      component['alternarMenu'](); // abre
      component['cerrarMenu'](); // cierra

      expect(spyFocus).toHaveBeenCalled();
    });

    it('Administración respeta el rol también dentro del drawer', () => {
      fixture.detectChanges();

      const drawer = (fixture.nativeElement as HTMLElement).querySelector('#app-drawer') as HTMLElement;
      expect(drawer.textContent).not.toContain('Administración');
    });

    it('el drawer y el backdrop existen en el DOM', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#app-drawer')).toBeTruthy();
      expect(compiled.querySelector('.app-drawer__backdrop')).toBeTruthy();
    });

    it('el header no está anidado dentro del drawer ni viceversa (estructuras separadas bajo la topbar)', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('.app-header')!;
      const drawer = compiled.querySelector('#app-drawer')!;

      expect(drawer.contains(header)).toBe(false);
      expect(header.contains(drawer)).toBe(false);
    });

    it('el header ya NO queda inert mientras el drawer está abierto (el hamburger debe seguir usable)', () => {
      fixture.detectChanges();

      component['alternarMenu']();
      fixture.detectChanges();

      const header = (fixture.nativeElement as HTMLElement).querySelector('.app-header');
      expect(header?.hasAttribute('inert')).toBe(false);
    });

    it('el botón hamburger cierra el drawer con un clic real mientras está abierto', () => {
      fixture.detectChanges();

      const boton: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector(
        '.app-mobile-header__toggle',
      )!;

      boton.click();
      fixture.detectChanges();
      expect(component['menuAbierto']()).toBe(true);

      boton.click();
      fixture.detectChanges();
      expect(component['menuAbierto']()).toBe(false);
    });

    it('el contenido principal (main-wrapper) sigue siendo inert mientras el drawer está abierto', () => {
      fixture.detectChanges();

      component['alternarMenu']();
      fixture.detectChanges();

      const mainWrapper = (fixture.nativeElement as HTMLElement).querySelector('.app-shell__main-wrapper');
      expect(mainWrapper?.hasAttribute('inert')).toBe(true);
    });
  });

  describe('sidebar de escritorio (colapsable)', () => {
    it('está visible (no colapsado) por defecto', () => {
      fixture.detectChanges();

      expect(component['sidebarColapsado']()).toBe(false);
    });

    it('el botón de escritorio existe en el DOM', () => {
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-header__toggle-desktop');
      expect(boton).toBeTruthy();
    });

    it('el botón de escritorio inicia con aria-expanded="true"', () => {
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-header__toggle-desktop');
      expect(boton?.getAttribute('aria-expanded')).toBe('true');
    });

    it('alternarSidebar() colapsa y vuelve a mostrar el sidebar', () => {
      fixture.detectChanges();

      component['alternarSidebar']();
      expect(component['sidebarColapsado']()).toBe(true);

      component['alternarSidebar']();
      expect(component['sidebarColapsado']()).toBe(false);
    });

    it('colapsar el sidebar actualiza aria-expanded y la clase del sidebar', () => {
      fixture.detectChanges();

      component['alternarSidebar']();
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-header__toggle-desktop');
      const sidebar = (fixture.nativeElement as HTMLElement).querySelector('#app-sidebar');

      expect(boton?.getAttribute('aria-expanded')).toBe('false');
      expect(sidebar?.classList.contains('app-sidebar--colapsado')).toBe(true);
    });

    it('el sidebar colapsado queda inert (no accesible por teclado)', () => {
      fixture.detectChanges();

      component['alternarSidebar']();
      fixture.detectChanges();

      const sidebar = (fixture.nativeElement as HTMLElement).querySelector('#app-sidebar');
      expect(sidebar?.hasAttribute('inert')).toBe(true);
    });

    it('el sidebar abierto no es inert', () => {
      fixture.detectChanges();

      const sidebar = (fixture.nativeElement as HTMLElement).querySelector('#app-sidebar');
      expect(sidebar?.hasAttribute('inert')).toBe(false);
    });

    it('colapsar/expandir el sidebar no altera la navegación ni el contenido funcional', () => {
      fixture.detectChanges();

      component['alternarSidebar'](); // colapsa
      fixture.detectChanges();

      const textos = textosDeEnlaces();
      expect(textos).toContain('Inicio');
      expect(textos).toContain('Mensaje nuevo');
      expect(textos).toContain('Bandeja de entrada');
      expect(textos).toContain('Formatos');
    });

    it('el estado del sidebar de escritorio es independiente del drawer móvil', () => {
      fixture.detectChanges();

      component['alternarSidebar']();
      expect(component['sidebarColapsado']()).toBe(true);
      expect(component['menuAbierto']()).toBe(false);

      component['alternarMenu']();
      expect(component['menuAbierto']()).toBe(true);
      expect(component['sidebarColapsado']()).toBe(true);
    });
  });

  describe('menú de cuenta', () => {
    it('el botón de cuenta existe y muestra las iniciales', () => {
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-header__account-btn');
      expect(boton).toBeTruthy();
      expect(boton?.textContent?.trim()).toBe(component['iniciales']());
    });

    it('el botón de cuenta inicia con aria-expanded="false"', () => {
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-header__account-btn');
      expect(boton?.getAttribute('aria-expanded')).toBe('false');
    });

    it('alternarMenuUsuario() abre y un segundo llamado cierra', () => {
      fixture.detectChanges();

      component['alternarMenuUsuario']();
      expect(component['menuUsuarioAbierto']()).toBe(true);

      component['alternarMenuUsuario']();
      expect(component['menuUsuarioAbierto']()).toBe(false);
    });

    it('abrir el menú actualiza aria-expanded y la clase del panel', () => {
      fixture.detectChanges();

      component['alternarMenuUsuario']();
      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('.app-header__account-btn');
      const panel = (fixture.nativeElement as HTMLElement).querySelector('#app-menu-cuenta');

      expect(boton?.getAttribute('aria-expanded')).toBe('true');
      expect(panel?.classList.contains('app-header__account-panel--abierto')).toBe(true);
    });

    it('el menú muestra nombre, usuario y rol reales de CurrentUser', () => {
      establecerSesion({
        id: 'dev-usuario-1',
        nombre: 'Usuario de Prueba Uno',
        usuario: 'usuario.prueba.uno',
        rol: 'Administrador',
      });
      fixture.detectChanges();

      component['alternarMenuUsuario']();
      fixture.detectChanges();

      const panel = (fixture.nativeElement as HTMLElement).querySelector('#app-menu-cuenta') as HTMLElement;
      expect(panel.textContent).toContain('Usuario de Prueba Uno');
      expect(panel.textContent).toContain('usuario.prueba.uno');
      expect(panel.textContent).toContain('Administrador');
    });

    it('sin sesión activa, el panel no muestra información de cuenta', () => {
      (authService as any).currentUserSignal.set(null);
      fixture.detectChanges();

      component['alternarMenuUsuario']();
      fixture.detectChanges();

      const panel = (fixture.nativeElement as HTMLElement).querySelector('#app-menu-cuenta') as HTMLElement;
      expect(panel.querySelector('.app-header__account-info')).toBeNull();
    });

    it('logout desde el menú de cuenta limpia la sesión y navega a /login', () => {
      fixture.detectChanges();
      component['alternarMenuUsuario']();
      fixture.detectChanges();

      const boton: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector(
        '.app-header__account-logout',
      )!;
      boton.click();

      expect(authService.isAuthenticated()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('Escape cierra el menú de cuenta y devuelve el foco al botón', () => {
      fixture.detectChanges();
      const boton: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector(
        '.app-header__account-btn',
      )!;
      const spyFocus = vi.spyOn(boton, 'focus');

      component['alternarMenuUsuario']();
      expect(component['menuUsuarioAbierto']()).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component['menuUsuarioAbierto']()).toBe(false);
      expect(spyFocus).toHaveBeenCalled();
    });

    it('el drawer ya no duplica el bloque de cuenta', () => {
      fixture.detectChanges();

      const drawer = (fixture.nativeElement as HTMLElement).querySelector('#app-drawer') as HTMLElement;
      expect(drawer.textContent).not.toContain('Cerrar sesión');
      expect(drawer.querySelector('.app-header__account-logout')).toBeNull();
    });

    it('abrir el drawer móvil cierra el menú de cuenta', () => {
      fixture.detectChanges();

      component['alternarMenuUsuario']();
      expect(component['menuUsuarioAbierto']()).toBe(true);

      component['alternarMenu']();

      expect(component['menuAbierto']()).toBe(true);
      expect(component['menuUsuarioAbierto']()).toBe(false);
    });

    it('abrir el menú de cuenta cierra el drawer móvil', () => {
      fixture.detectChanges();

      component['alternarMenu']();
      expect(component['menuAbierto']()).toBe(true);

      component['alternarMenuUsuario']();

      expect(component['menuUsuarioAbierto']()).toBe(true);
      expect(component['menuAbierto']()).toBe(false);
    });

    it('pulsar el botón de cuenta con un clic real mientras el drawer está abierto lo cierra y abre el menú de usuario', () => {
      fixture.detectChanges();

      component['alternarMenu']();
      fixture.detectChanges();
      expect(component['menuAbierto']()).toBe(true);

      const botonCuenta: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector(
        '.app-header__account-btn',
      )!;
      botonCuenta.click();

      expect(component['menuUsuarioAbierto']()).toBe(true);
      expect(component['menuAbierto']()).toBe(false);
    });

    it('el sidebar de escritorio sigue funcionando independientemente del menú de cuenta', () => {
      fixture.detectChanges();

      component['alternarMenuUsuario']();
      component['alternarSidebar']();

      expect(component['menuUsuarioAbierto']()).toBe(true);
      expect(component['sidebarColapsado']()).toBe(true);
    });
  });

  describe('iniciales del botón de cuenta', () => {
    it('un nombre de varios términos usa la primera letra de los dos primeros términos significativos', () => {
      establecerSesion({ id: 'x', nombre: 'Usuario de Prueba Uno', usuario: 'x', rol: 'Usuario' });
      fixture.detectChanges();

      expect(component['iniciales']()).toBe('UP');
    });

    it('un nombre de un solo término usa solo su primera letra', () => {
      establecerSesion({ id: 'x', nombre: 'Sergio', usuario: 'x', rol: 'Usuario' });
      fixture.detectChanges();

      expect(component['iniciales']()).toBe('S');
    });

    it('un nombre con espacios extra se normaliza correctamente', () => {
      establecerSesion({ id: 'x', nombre: '  Juan   José  ', usuario: 'x', rol: 'Usuario' });
      fixture.detectChanges();

      expect(component['iniciales']()).toBe('JJ');
    });

    it('sin sesión, usa el valor de reserva "U"', () => {
      (authService as any).currentUserSignal.set(null);
      fixture.detectChanges();

      expect(component['iniciales']()).toBe('U');
    });
  });
});
