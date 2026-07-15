import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.hash = '';

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function crearComponente(preInit?: (app: App) => void) {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    if (preInit) {
      preInit(app);
    }

    const reqMensajes = httpMock.expectOne('http://localhost:3000/api/mensajes');
    reqMensajes.flush([]);

    const reqRecordatorios = httpMock.expectOne('http://localhost:3000/api/recordatorios');
    reqRecordatorios.flush([]);

    return fixture;
  }

  it('should create the app', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = crearComponente((app) => {
      app.sesionIniciada = true;
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Inicio');
  });

  it('should clear notifications after timeout', () => {
    vi.useFakeTimers();
    const fixture = crearComponente();
    const app = fixture.componentInstance;
    app.mostrarNotificacion('Recordatorio agregado correctamente.', 'exito');
    expect(app.notificacion?.mensaje).toBe('Recordatorio agregado correctamente.');
    vi.advanceTimersByTime(3100);
    expect(app.notificacion).toBeNull();
    vi.useRealTimers();
  });

  it('should reset cargandoLogin to false on validation failure', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;
    
    app.usuarioLogin = '';
    app.contrasenaLogin = '123';
    app.cargandoLogin = true;
    
    app.hacerLogin(new Event('submit'));
    
    expect(app.cargandoLogin).toBe(false);
  });

  it('should handle login success and update status', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;
    
    app.usuarioLogin = 'admin';
    app.contrasenaLogin = '123';
    
    app.hacerLogin(new Event('submit'));
    expect(app.cargandoLogin).toBe(true);
    
    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuario: 'admin', password: '123' });
    
    req.flush({
      user: {
        id: 1,
        nombre: 'Administrador',
        usuario: 'admin',
        rol: 'Administrador'
      },
      requiresPasswordChange: false
    });
    
    const reqUsers = httpMock.expectOne('http://localhost:3000/api/usuarios');
    reqUsers.flush([]);
    const reqMsg = httpMock.expectOne('http://localhost:3000/api/mensajes');
    reqMsg.flush([]);
    const reqRec = httpMock.expectOne('http://localhost:3000/api/recordatorios');
    reqRec.flush([]);
    
    expect(app.sesionIniciada).toBe(true);
    expect(app.usuarioActual.nombre).toBe('Administrador');
    expect(app.cargandoLogin).toBe(false);
  });

  it('should handle login error and reset loading flag', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fixture = crearComponente();
    const app = fixture.componentInstance;
    
    app.usuarioLogin = 'admin';
    app.contrasenaLogin = '1234';
    
    app.hacerLogin(new Event('submit'));
    expect(app.cargandoLogin).toBe(true);
    
    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    
    expect(app.sesionIniciada).toBe(false);
    expect(app.cargandoLogin).toBe(false);

    consoleSpy.mockRestore();
  });
});
