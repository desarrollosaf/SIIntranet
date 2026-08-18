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
  });
});
