import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { AppShell } from './app-shell';
import { AuthService } from '../../core/auth/auth.service';
import { CurrentUser } from '../../core/models/current-user.model';

describe('AppShell', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;
  let authService: AuthService;
  let router: Router;

  function establecerSesion(currentUser: CurrentUser): void {
    (authService as any).currentUserSignal.set(currentUser);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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

  it('no muestra el enlace de Administración a un Usuario normal', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlaces = Array.from(compiled.querySelectorAll('a')).map((a) => a.textContent?.trim());

    expect(enlaces).not.toContain('Administración');
  });

  it('muestra el enlace de Administración a un Administrador', () => {
    establecerSesion({
      id: 'dev-usuario-1',
      nombre: 'admin',
      usuario: 'admin',
      rol: 'Administrador',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enlaces = Array.from(compiled.querySelectorAll('a')).map((a) => a.textContent?.trim());

    expect(enlaces).toContain('Administración');
  });
});
