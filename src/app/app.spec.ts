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

  it('should precargar datos and change to edit mode when activating message edit', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;

    const mensajeMock: any = {
      id: 123,
      titulo: 'Mensaje de prueba',
      descripcion: 'Descripción de prueba',
      fecha: '2026-07-16',
      hora: '14:00',
      destinatarios: 'Juan Perez, Maria Lopez',
      documento: 'doc1.pdf, doc2.docx',
      estado: 'Enviado'
    };

    app.moduloActual = 'inicio';
    app.activarEdicionModuloMensaje(mensajeMock);

    expect(app.modoFormularioMensaje).toBe('editar');
    expect(app.mensajeEditando).toEqual(mensajeMock);
    expect(app.formularioTitulo).toBe('Mensaje de prueba');
    expect(app.formularioDescripcion).toBe('Descripción de prueba');
    expect(app.formularioFecha).toBe('2026-07-16');
    expect(app.formularioHora).toBe('14:00');
    expect(app.usuariosSeleccionados).toEqual(['Juan Perez', 'Maria Lopez']);
    expect(app.formularioDocumentosExistentes).toEqual(['doc1.pdf', 'doc2.docx']);
    expect(app.moduloActual).toBe('mensaje');
  });

  it('should perform POST when sending message in create mode', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;

    app.modoFormularioMensaje = 'crear';
    app.formularioTitulo = 'Nuevo Asunto';
    app.formularioDescripcion = 'Nueva Descripcion';
    app.usuariosSeleccionados = ['Destinatario 1'];

    app.enviarMensaje(new Event('submit'));
    expect(app.cargandoMensaje).toBe(true);

    const req = httpMock.expectOne('http://localhost:3000/api/mensajes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.titulo).toBe('Nuevo Asunto');
    req.flush({});

    const reqSent = httpMock.expectOne('http://localhost:3000/api/mensajes/enviados');
    reqSent.flush([]);

    expect(app.cargandoMensaje).toBe(false);
  });

  it('should perform PATCH and reload inbox when sending message in edit mode', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;

    const mensajeMock: any = {
      id: 123,
      titulo: 'Original',
      descripcion: 'Original Desc',
      fecha: '2026-07-16',
      hora: '14:00',
      destinatarios: 'Juan Perez',
      documento: 'doc1.pdf',
      remitente: 'María Rodríguez López',
      estado: 'Enviado'
    };

    app.usuarioActual.nombre = 'María Rodríguez López';
    app.mensajeEditando = mensajeMock;
    app.modoFormularioMensaje = 'editar';
    app.moduloPrevioAEdicion = 'mensaje';
    app.formularioTitulo = 'Modificado';
    app.formularioDescripcion = 'Modificado Desc';
    app.usuariosSeleccionados = ['Juan Perez'];
    app.formularioDocumentosExistentes = ['doc1.pdf'];
    app.formularioArchivos = [];

    app.enviarMensaje(new Event('submit'));
    expect(app.cargandoMensaje).toBe(true);

    const req = httpMock.expectOne('http://localhost:3000/api/mensajes/123');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.titulo).toBe('Modificado');
    expect(req.request.body.documento).toBe('doc1.pdf');
    req.flush(mensajeMock);

    // Expect reload request for sent messages (can match multiple depending on lifecycle hooks)
    const reqsSent = httpMock.match('http://localhost:3000/api/mensajes/enviados');
    reqsSent.forEach(r => r.flush([]));

    expect(app.cargandoMensaje).toBe(false);
    expect(app.modoFormularioMensaje).toBe('crear');
    expect(app.mensajeEditando).toBeNull();
  });

  it('should clean state when cancelling message edit', () => {
    const fixture = crearComponente();
    const app = fixture.componentInstance;

    app.modoFormularioMensaje = 'editar';
    app.mensajeEditando = { id: 1 } as any;
    app.formularioTitulo = 'Modificado';
    app.formularioDocumentosExistentes = ['doc1.pdf'];
    app.moduloPrevioAEdicion = 'bandeja';

    app.cancelarFormulario();

    const reqRecibidos = httpMock.expectOne('http://localhost:3000/api/mensajes/recibidos');
    reqRecibidos.flush([]);

    expect(app.modoFormularioMensaje).toBe('crear');
    expect(app.mensajeEditando).toBeNull();
    expect(app.formularioTitulo).toBe('');
    expect(app.formularioDocumentosExistentes).toEqual([]);
    expect(app.moduloActual).toBe('bandeja');
  });
});
