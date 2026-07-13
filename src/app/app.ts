import { Component, ChangeDetectorRef, HostListener, OnDestroy, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface Mensaje {
  id: number;
  remitente: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  documento: string;
  destinatarios: string;
  estado: 'Enviando' | 'Nuevo' | 'Visto' | 'Respondido' | 'Cancelado' | 'Eliminado' | 'Enviado' | 'Pendiente';
  tipoMensaje?: 'recibido' | 'enviado';
  estadoLectura?: 'Nuevo' | 'Visto';
  estadoRespuesta?: 'Pendiente' | 'Respondido';
  estadoTemporal?: 'Enviando' | 'Respondiendo' | 'Eliminando' | 'Cancelando' | 'Guardando' | 'Cargando' | null;
  confirmarEliminarSent?: boolean;
}

export interface EventoCalendario {
  id?: number;
  fecha: string;
  tipo: 'enviado' | 'recibido' | 'recordatorio';
  titulo: string;
  descripcion: string;
  hora?: string;
  estados?: string[];
  esEnviado?: boolean;
  mensajeAsociado?: Mensaje;
}

export interface UsuarioSistema {
  id: number;
  nombre: string;
  usuario: string;
  correo: string;
  area: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  passwordTemporal?: string;
  password?: string;
  requiereCambioPassword?: boolean;
}

export interface DocumentoFormato {
  id?: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  archivo: string;
  tipoArchivo?: string;
  fechaCreacion?: string;
  estado?: 'Activo' | 'Inactivo';
}


@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {

  private readonly urlApi = 'http://localhost:3000/api';

  ultimoElementoEnfocado: HTMLElement | null = null;

  documentosFormatos: { [categoria: string]: DocumentoFormato[] } = {};

  verContrasenaEdicionUsuario = false;
  mostrarContrasenaLogin = false;
  mostrarCambioObligatorioModal = false;
  usuarioPendienteCambio: UsuarioSistema | null = null;
  nuevaPassword = '';
  confirmarNuevaPassword = '';
  verNuevaPassword = false;
  verConfirmarPassword = false;

  mensajeEditando: Mensaje | null = null;
  detalleEditandoMensaje = false;
  editarMensajeTitulo = '';
  editarMensajeDescripcion = '';
  editarMensajeFecha = '';
  editarMensajeHora = '';
  editarMensajeDocumentos: string[] = [];
  editarMensajeNuevosArchivos: File[] = [];

  esMensajeNuevo(msg: Mensaje | null | undefined): boolean {
    if (!msg) return false;
    return msg.estado === 'Nuevo' || msg.estadoLectura === 'Nuevo';
  }

  formatearFechaMensaje(fecha: string | null | undefined): string {
    if (!fecha) {
      fecha = this.formatearFechaLocal(new Date());
    }
    const partes = fecha.split('-');
    if (partes.length === 3) {
      const año = partes[0];
      const mes = partes[1];
      const dia = partes[2];
      return `${dia}/${mes}/${año}`;
    }
    if (fecha.includes('/')) {
      return fecha;
    }
    return fecha;
  }

  formatearHoraMensaje(hora: string | null | undefined): string {
    if (!hora) {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      hora = `${h}:${m}`;
    }
    if (hora.length > 5) {
      return hora.substring(0, 5);
    }
    return hora;
  }

  asegurarFechaHoraMensajes(): void {
    if (!this.mensajesBandeja) return;
    const hoyStr = this.formatearFechaLocal(new Date());
    const d = new Date();
    const hStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    this.mensajesBandeja.forEach(m => {
      if (!m.fecha) m.fecha = hoyStr;
      if (!m.hora) m.hora = hStr;
    });
  }

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone, private http: HttpClient) {
    this.inicializarDatosPrueba();
    this.detectarSesionGuardada();
    this.asegurarFechaHoraMensajes();
    this.detectarModuloInicial();
    this.categoriasFormatos.forEach(cat => {
      this.documentosFormatos[cat] = [];
    });
    this.inicializarVisitas();
    this.actualizarUsuariosDisponibles();
  }

  ngOnDestroy(): void {
    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
    }
    for (const key in this.tiemposEnvio) {
      if (Object.prototype.hasOwnProperty.call(this.tiemposEnvio, key)) {
        clearTimeout(this.tiemposEnvio[key]);
      }
    }
    this.tiemposGenerales.forEach(t => clearTimeout(t));
  }

  inicializarVisitas(): void {
    const visitasStr = localStorage.getItem('si_visitas_intranet');
    let visitas = visitasStr ? parseInt(visitasStr, 10) : 0;
    visitas++;
    localStorage.setItem('si_visitas_intranet', visitas.toString());
    this.totalVisitas = visitas.toLocaleString('es-MX');
  }

  actualizarUsuariosDisponibles(): void {
    const activos = this.usuariosSistema.filter(u => u.estado === 'Activo');
    const activeLabels = activos.map(u => `${u.nombre} - ${u.area}`);
    this.usuariosDisponibles = activeLabels.filter(label => !this.usuariosSeleccionados.includes(label));
  }

  detectarSesionGuardada(): void {
    const logged = sessionStorage.getItem('si_session_logged');
    const userStr = sessionStorage.getItem('si_session_user');
    if (logged === 'true' && userStr) {
      try {
        this.usuarioActual = JSON.parse(userStr);
        this.sesionIniciada = true;
        if (this.usuarioActual.tipo === 'admin') {
          this.cargarUsuarios();
        }
        this.cargarMensajes();
        this.cargarRecordatorios();
      } catch (e) {
        this.sesionIniciada = false;
      }
    }
  }

  detectarModuloInicial(): void {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['inicio', 'mensaje', 'bandeja', 'formatos', 'administracion'].includes(hash)) {
      if (hash === 'administracion' && this.usuarioActual.tipo !== 'admin') {
        this.moduloActual = 'inicio';
        window.location.hash = 'inicio';
      } else {
        this.moduloActual = hash;
        this.cargarDatosModulo(hash);
      }
    } else {
      this.moduloActual = 'inicio';
      this.cargarDatosModulo('inicio');
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    const state = event.state;
    if (state && state.modulo) {
      this.navegarModuloSinHistorial(state.modulo);
    } else {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        this.navegarModuloSinHistorial(hash);
      } else {
        this.navegarModuloSinHistorial('inicio');
      }
    }
  }

  navegarModuloSinHistorial(modulo: string): void {
    if (modulo === 'administracion' && this.usuarioActual.tipo !== 'admin') {
      this.moduloActual = 'inicio';
      window.history.replaceState({ modulo: 'inicio' }, '', '#inicio');
      this.mostrarNotificacion('Acceso restringido: Solo los administradores pueden acceder a esta sección.', 'error');
      return;
    }
    this.moduloActual = modulo;
    if (modulo === 'mensaje') {
      this.actualizarFechaHora();
    }
    this.cargarDatosModulo(modulo);
    this.cdr.detectChanges();
  }

  moduloActual = 'inicio';

  diasSemanaCalendario = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  mesCalendario = new Date().getMonth();
  anioCalendario = new Date().getFullYear();

  fechaSeleccionadaCalendario = this.formatearFechaLocal(new Date());
  nuevoRecordatorioCalendario = '';
  nuevoRecordatorioHoraCalendario = '';
  calendarioModalAbierto = false;
  fechaBusquedaCalendario = '';
  filtroEventosCalendario: 'Todos' | 'Mensajes' | 'Recordatorios' = 'Todos';
  buscarDestinatario = '';

  recordatoriosCalendario: EventoCalendario[] = [];

  notificacion: { mensaje: string; tipo: 'error' | 'exito' | 'info' | 'advertencia' } | null = null;
  private notificacionTimeout: ReturnType<typeof setTimeout> | null = null;

  mostrarNotificacion(mensaje: string, tipo: 'error' | 'exito' | 'info' | 'advertencia' = 'info'): void {
    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
      this.notificacionTimeout = null;
    }
    this.zone.run(() => {
      this.notificacion = { mensaje, tipo };
      this.cdr.detectChanges();
    });

    let duration = 3000;
    if (tipo === 'error') {
      duration = 5000;
    } else if (tipo === 'advertencia') {
      duration = 4000;
    }

    this.zone.runOutsideAngular(() => {
      this.notificacionTimeout = setTimeout(() => {
        this.zone.run(() => {
          this.notificacion = null;
          this.cdr.detectChanges();
          this.notificacionTimeout = null;
        });
      }, duration);
    });
  }

  obtenerMensajeError(err: any, fallback: string): string {
    if (err && err.error && err.error.message) {
      if (typeof err.error.message === 'string') {
        return err.error.message;
      }
      if (Array.isArray(err.error.message)) {
        return err.error.message.join(' ');
      }
    }
    return fallback;
  }

  private ultimaNotificacionConexion = 0;

  manejarErrorHttp(err: any, fallback: string, tipo: 'error' | 'exito' | 'info' | 'advertencia' = 'error'): void {
    if (err && err.status === 0) {
      const ahora = Date.now();
      if (ahora - this.ultimaNotificacionConexion > 5000) {
        this.mostrarNotificacion('No se pudo conectar con el servidor. Verifica que el backend esté activo.', 'error');
        this.ultimaNotificacionConexion = ahora;
      }
      return;
    }

    const mensaje = this.obtenerMensajeError(err, fallback);
    this.mostrarNotificacion(mensaje, tipo);
  }

  sesionIniciada = false;
  usuarioLogin = '';
  contrasenaLogin = '';

  cargandoLogin = false;
  cargandoUsuario = false;
  cargandoEstadoUsuario = false;
  cargandoMensaje = false;
  cargandoEdicionMensaje = false;
  cargandoRecordatorio = false;

  confirmacionModalAbierto = false;
  confirmacionTitulo = '';
  confirmacionMensajeInicio = '';
  confirmacionElementoDestacado = '';
  confirmacionMensajeFin = '';
  confirmacionTextoAceptar = '';
  confirmacionTipo: 'danger' | 'success' | 'warning' | 'primary' = 'warning';
  confirmacionIcono = 'bi-exclamation-triangle-fill';
  confirmacionCallback: (() => void) | null = null;

  mostrarPerfilModal = false;

  usuarioActual = {
    nombre: 'Usuario del sistema',
    rol: 'Usuario',
    tipo: 'normal' as 'normal' | 'admin'
  };

  usuariosSistema: UsuarioSistema[] = [];

  buscarUsuarioAdmin = '';
  filtroRolAdmin = 'Todos';
  filtroEstadoAdmin = 'Todos';
  usuarioSeleccionadoAdmin: UsuarioSistema | null = null;
  usuarioEditandoAdmin: UsuarioSistema | null = null;
  modalVerUsuarioAbierto = false;
  modalEditarUsuarioAbierto = false;

  totalVisitas = '--';

  enlacesExternos = [
    { nombre: 'Cámara de Diputados del Estado de México', url: 'https://congresoedomex.gob.mx/' },
    { nombre: 'Instituto de Estudios Legislativos', url: 'https://www.inesle.gob.mx/' },
    { nombre: 'Órgano Superior de Fiscalización', url: 'https://www.osfem.gob.mx/' },
    { nombre: 'Secretaría de Asuntos Parlamentarios', url: 'https://legislacion.congresoedomex.gob.mx/asuntosparlamentarios/secretaria' },
    { nombre: 'Contraloría del Poder Legislativo', url: 'https://contraloriadelpoderlegislativo.gob.mx/index' }
  ];

  usuariosDisponibles: string[] = [];
  usuariosSeleccionados: string[] = [];

  usuariosDisponiblesMarcados: string[] = [];
  destinatariosMarcados: string[] = [];

  formularioTitulo = '';
  formularioDescripcion = '';
  formularioFecha = '';
  formularioHora = '';
  formularioArchivos: File[] = [];

  tiemposEnvio: { [key: number]: ReturnType<typeof setTimeout> } = {};
  private tiemposGenerales: ReturnType<typeof setTimeout>[] = [];

  mensajesBandeja: Mensaje[] = [];

  buscarTexto = '';
  buscarEstado = 'Todos';
  buscarFecha = '';

  buscarTextoEnviados = '';
  buscarEstadoEnviados = 'Todos';

  mensajeSeleccionado: Mensaje | null = null;

  get nombreMesCalendario(): string {
    const fecha = new Date(this.anioCalendario, this.mesCalendario, 1);

    return new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric'
    }).format(fecha);
  }

  get eventosCalendario(): EventoCalendario[] {
    const eventosMensajes = this.mensajesBandeja
      .filter(msg => msg.fecha && msg.estado !== 'Eliminado' && msg.estadoTemporal !== 'Eliminando')
      .map(msg => ({
        fecha: msg.fecha,
        tipo: (this.esMensajeEnviado(msg) ? 'enviado' : 'recibido') as 'enviado' | 'recibido' | 'recordatorio',
        titulo: msg.titulo || 'Documento',
        descripcion: `${this.esMensajeEnviado(msg) ? 'Para: ' + msg.destinatarios : 'De: ' + msg.remitente} · Estado: ${this.obtenerEstadosMensaje(msg).join(' + ')}`,
        hora: msg.hora,
        estados: this.obtenerEstadosMensaje(msg),
        esEnviado: this.esMensajeEnviado(msg),
        mensajeAsociado: msg
      }));

    return [
      ...eventosMensajes,
      ...this.recordatoriosCalendario
    ];
  }

  get diasCalendario() {
    const primerDiaMes = new Date(this.anioCalendario, this.mesCalendario, 1);
    const totalDiasMes = new Date(this.anioCalendario, this.mesCalendario + 1, 0).getDate();

    const inicioSemana = (primerDiaMes.getDay() + 6) % 7;
    const dias: {
      dia: number | null;
      fecha: string;
      eventos: EventoCalendario[];
      esHoy: boolean;
    }[] = [];

    for (let i = 0; i < inicioSemana; i++) {
      dias.push({
        dia: null,
        fecha: '',
        eventos: [],
        esHoy: false
      });
    }

    const hoy = this.formatearFechaLocal(new Date());

    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const fecha = this.formatearFechaLocal(new Date(this.anioCalendario, this.mesCalendario, dia));

      dias.push({
        dia,
        fecha,
        eventos: this.obtenerEventosPorFecha(fecha),
        esHoy: fecha === hoy
      });
    }

    const totalCeldas = 42;
    while (dias.length < totalCeldas) {
      dias.push({
        dia: null,
        fecha: '',
        eventos: [],
        esHoy: false
      });
    }

    return dias;
  }

  get eventosFechaSeleccionadaCalendario(): EventoCalendario[] {
    return this.obtenerEventosPorFecha(this.fechaSeleccionadaCalendario);
  }

  get fechaSeleccionadaCalendarioTexto(): string {
    const fecha = new Date(`${this.fechaSeleccionadaCalendario}T00:00:00`);

    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(fecha);
  }

  obtenerEventosPorFecha(fecha: string): EventoCalendario[] {
    return this.eventosCalendario.filter(evento => evento.fecha === fecha);
  }

  seleccionarFechaCalendario(fecha: string): void {
    if (!fecha) return;
    this.fechaSeleccionadaCalendario = fecha;
  }

  mesAnteriorCalendario(): void {
    if (this.mesCalendario === 0) {
      this.mesCalendario = 11;
      this.anioCalendario--;
    } else {
      this.mesCalendario--;
    }
  }

  mesSiguienteCalendario(): void {
    if (this.mesCalendario === 11) {
      this.mesCalendario = 0;
      this.anioCalendario++;
    } else {
      this.mesCalendario++;
    }
  }

  agregarRecordatorioCalendario(event: Event): void {
    event.preventDefault();

    const descripcion = (this.nuevoRecordatorioCalendario || '').trim();

    if (!descripcion) {
      this.mostrarNotificacion('El recordatorio no puede estar vacío.', 'error');
      return;
    }

    if (!this.validarLongitudRecordatorio(descripcion)) {
      this.mostrarNotificacion('El recordatorio no puede exceder los 150 caracteres.', 'error');
      return;
    }

    const fecha = this.fechaSeleccionadaCalendario;
    if (!fecha) {
      this.mostrarNotificacion('Por favor seleccione una fecha para el recordatorio.', 'error');
      return;
    }

    const hora = (this.nuevoRecordatorioHoraCalendario || '').trim();
    if (!hora) {
      this.mostrarNotificacion('Por favor especifique la hora para el recordatorio.', 'error');
      return;
    }

    const body = {
      titulo: 'Recordatorio',
      descripcion: descripcion,
      fecha: fecha,
      hora: hora,
      tipo: 'recordatorio' as const,
      estado: 'Activo' as const,
      creadoPor: this.usuarioActual.nombre
    };

    this.cargandoRecordatorio = true;
    this.http.post<EventoCalendario>(`${this.urlApi}/recordatorios`, body).subscribe({
      next: (response) => {
        this.mostrarNotificacion('Recordatorio agregado correctamente.', 'exito');
        this.cargandoRecordatorio = false;
        this.nuevoRecordatorioCalendario = '';
        this.nuevoRecordatorioHoraCalendario = '';
        this.cargarRecordatorios();
      },
      error: (err) => {
        console.error(err);
        this.cargandoRecordatorio = false;
        this.mostrarNotificacion('No se pudo crear el recordatorio.', 'error');
      }
    });
  }

  eliminarRecordatorioCalendario(id: number | undefined, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (id === undefined) return;

    this.abrirConfirmacion({
      titulo: 'Eliminar Recordatorio',
      mensajeInicio: '¿Está seguro de que desea eliminar este recordatorio?',
      textoAceptar: 'Eliminar',
      tipo: 'danger',
      icono: 'bi-trash-fill',
      callback: () => {
        this.http.delete<EventoCalendario>(`${this.urlApi}/recordatorios/${id}`).subscribe({
          next: (response) => {
            this.mostrarNotificacion('Recordatorio eliminado.', 'exito');
            this.cargarRecordatorios();
          },
          error: (err) => {
            console.error(err);
            this.mostrarNotificacion('No se pudo eliminar el recordatorio.', 'error');
          }
        });
      }
    });
  }

  private formatearFechaLocal(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  categoriasFormatos: string[] = [
    'Formatos',
    'Secretaría de Administración y Finanzas',
    'Secretaría Particular',
    'Secretaría Técnica',
    'Unidad de Información, Planeación, Programación y Evaluación',
    'Coordinación de Normatividad',
    'Unidad de Igualdad de Género y Erradicación de la Violencia',
    'Dirección de Administración y Desarrollo de Personal',
    'Dirección de Recursos Materiales',
    'Dirección de Finanzas',
    'Dirección de Informática'
  ];

  cambiarModulo(modulo: string): void {
    if (modulo === 'administracion' && this.usuarioActual.tipo !== 'admin') {
      this.moduloActual = 'inicio';
      window.location.hash = 'inicio';
      window.history.replaceState({ modulo: 'inicio' }, '', '#inicio');
      this.mostrarNotificacion('Acceso restringido: Solo los administradores pueden acceder a esta sección.', 'error');
      return;
    }
    this.moduloActual = modulo;
    if (modulo === 'mensaje') {
      this.actualizarFechaHora();
    }
    this.cargarDatosModulo(modulo);

    const hash = '#' + modulo;
    if (window.location.hash !== hash) {
      window.history.pushState({ modulo }, '', hash);
    }
  }

  get tituloModulo(): string {
    switch (this.moduloActual) {
      case 'mensaje':
        return 'Mensaje nuevo';
      case 'bandeja':
        return 'Bandeja de entrada';
      case 'formatos':
        return 'Formatos';
      case 'administracion':
        return 'Administración';
      default:
        return 'Inicio';
    }
  }

  actualizarFechaHora(): void {
    const actual = new Date();
    const año = actual.getFullYear();
    const mes = String(actual.getMonth() + 1).padStart(2, '0');
    const dia = String(actual.getDate()).padStart(2, '0');
    this.formularioFecha = `${año}-${mes}-${dia}`;

    const horas = String(actual.getHours()).padStart(2, '0');
    const minutos = String(actual.getMinutes()).padStart(2, '0');
    this.formularioHora = `${horas}:${minutos}`;
  }

  alSeleccionarArchivo(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (!this.formularioArchivos.some(f => f.name === files[i].name)) {
          this.formularioArchivos.push(files[i]);
        }
      }
    }
    target.value = '';
  }

  limpiarArchivoSeleccionado(index: number): void {
    this.formularioArchivos.splice(index, 1);
  }

  pasar(): void {
    if (this.usuariosDisponiblesMarcados.length === 0) return;
    const aPasar = this.usuariosDisponiblesMarcados.filter(u => !this.usuariosSeleccionados.includes(u));
    this.usuariosSeleccionados = [...this.usuariosSeleccionados, ...aPasar];
    this.usuariosDisponibles = this.usuariosDisponibles.filter(u => !this.usuariosDisponiblesMarcados.includes(u));
    this.usuariosDisponiblesMarcados = [];
  }

  quitar(): void {
    if (this.destinatariosMarcados.length === 0) return;
    const aQuitar = this.destinatariosMarcados.filter(u => !this.usuariosDisponibles.includes(u));
    this.usuariosDisponibles = [...this.usuariosDisponibles, ...aQuitar];
    this.usuariosSeleccionados = this.usuariosSeleccionados.filter(u => !this.destinatariosMarcados.includes(u));
    this.destinatariosMarcados = [];
  }

  pasarTodos(): void {
    const aPasar = this.usuariosDisponibles.filter(u => !this.usuariosSeleccionados.includes(u));
    this.usuariosSeleccionados = [...this.usuariosSeleccionados, ...aPasar];
    this.usuariosDisponibles = [];
    this.usuariosDisponiblesMarcados = [];
  }

  quitarTodos(): void {
    const aQuitar = this.usuariosSeleccionados.filter(u => !this.usuariosDisponibles.includes(u));
    this.usuariosDisponibles = [...this.usuariosDisponibles, ...aQuitar];
    this.usuariosSeleccionados = [];
    this.destinatariosMarcados = [];
  }

  pasarDirecto(usuario: string): void {
    if (!this.usuariosSeleccionados.includes(usuario)) {
      this.usuariosSeleccionados = [...this.usuariosSeleccionados, usuario];
      this.usuariosDisponibles = this.usuariosDisponibles.filter(u => u !== usuario);
    }
    this.usuariosDisponiblesMarcados = this.usuariosDisponiblesMarcados.filter(u => u !== usuario);
  }

  quitarDirecto(usuario: string): void {
    if (!this.usuariosDisponibles.includes(usuario)) {
      this.usuariosDisponibles = [...this.usuariosDisponibles, usuario];
      this.usuariosSeleccionados = this.usuariosSeleccionados.filter(u => u !== usuario);
    }
    this.destinatariosMarcados = this.destinatariosMarcados.filter(u => u !== usuario);
  }

  enviarMensaje(event: Event): void {
    event.preventDefault();
    if (!this.formularioTitulo.trim()) {
      this.mostrarNotificacion('Por favor ingrese un título para el documento.', 'error');
      return;
    }
    if (!this.formularioDescripcion || !this.formularioDescripcion.trim()) {
      this.mostrarNotificacion('Por favor ingrese una descripción para el mensaje.', 'error');
      return;
    }
    if (this.usuariosSeleccionados.length === 0) {
      this.mostrarNotificacion('Por favor seleccione al menos un destinatario.', 'error');
      return;
    }

    const documentosAdjuntos = this.formularioArchivos.length > 0
      ? this.formularioArchivos.map(f => f.name).join(', ')
      : 'Sin adjunto';

    const actual = new Date();
    const hoyStr = this.formatearFechaLocal(actual);
    const horaStr = `${String(actual.getHours()).padStart(2, '0')}:${String(actual.getMinutes()).padStart(2, '0')}`;

    const body = {
      titulo: this.formularioTitulo.trim(),
      descripcion: this.formularioDescripcion.trim(),
      remitente: this.usuarioActual.nombre,
      destinatarios: this.usuariosSeleccionados.join(', '),
      documento: documentosAdjuntos,
      fecha: this.formularioFecha || hoyStr,
      hora: this.formularioHora || horaStr,
      estado: 'Enviado' as const,
      tipoMensaje: 'enviado' as const
    };

    this.cargandoMensaje = true;
    this.http.post<Mensaje>(`${this.urlApi}/mensajes`, body).subscribe({
      next: (response) => {
        this.mostrarNotificacion('Mensaje enviado correctamente.', 'exito');
        this.cargandoMensaje = false;
        this.resetearFormulario();
        this.actualizarFechaHora();
        this.cargarMensajesEnviados();
      },
      error: (err) => {
        console.error(err);
        this.cargandoMensaje = false;
        this.mostrarNotificacion('No se pudo enviar el mensaje. Verifica que el backend esté activo.', 'error');
      }
    });
  }

  cancelarEnvio(id: number): void {
    if (this.tiemposEnvio[id]) {
      clearTimeout(this.tiemposEnvio[id]);
      delete this.tiemposEnvio[id];
    }
    const msg = this.mensajesBandeja.find(m => m.id === id);
    if (msg) {
      msg.estado = 'Cancelado';
    }
    this.mostrarNotificacion('Envío cancelado. El registro se guardó con estado "Cancelado".', 'info');
  }

  get mensajesEnviados(): Mensaje[] {
    return this.mensajesBandeja.filter(m => this.esMensajeEnviado(m));
  }

  get mensajesEnviadosFiltrados(): Mensaje[] {
    let list = this.mensajesBandeja.filter(m => this.esMensajeEnviado(m) && m.estado !== 'Eliminado');

    list.sort((a, b) => this.compararMensajes(a, b));

    const textQuery = (this.buscarTextoEnviados || '').trim().toLowerCase();
    if (textQuery) {
      list = list.filter(m =>
        (m.titulo || '').toLowerCase().includes(textQuery) ||
        (m.descripcion || '').toLowerCase().includes(textQuery) ||
        (m.destinatarios || '').toLowerCase().includes(textQuery) ||
        (m.documento || '').toLowerCase().includes(textQuery)
      );
    }

    const statusQuery = this.buscarEstadoEnviados;
    if (statusQuery === 'Todos') {
      list = list.filter(m => m.estado !== 'Eliminado');
    } else {
      list = list.filter(m => m.estado === statusQuery);
    }

    return list;
  }

  get usuariosDisponiblesFiltrados(): string[] {
    if (!this.buscarDestinatario.trim()) {
      return this.usuariosDisponibles;
    }
    const query = this.buscarDestinatario.toLowerCase().trim();
    return this.usuariosDisponibles.filter(u => u.toLowerCase().includes(query));
  }

  resetearFormulario(): void {
    this.formularioTitulo = '';
    this.formularioDescripcion = '';
    this.formularioArchivos = [];
    this.usuariosSeleccionados = [];
    this.usuariosDisponiblesMarcados = [];
    this.destinatariosMarcados = [];
    this.buscarDestinatario = '';
    this.actualizarUsuariosDisponibles();
  }

  cancelarFormulario(): void {
    this.resetearFormulario();
    this.actualizarFechaHora();
  }

  get mensajesFiltrados(): Mensaje[] {
    const list = this.mensajesBandeja.filter(msg => {
      if (msg.estado === 'Eliminado') return false;

      const query = (this.buscarTexto || '').toLowerCase().trim();
      const matchesText = !query ||
        (msg.remitente || '').toLowerCase().includes(query) ||
        (msg.titulo || '').toLowerCase().includes(query) ||
        (msg.descripcion || '').toLowerCase().includes(query);

      let matchesEstado = false;
      const esEnviado = this.esMensajeEnviado(msg);
      const esRecibido = this.esMensajeRecibido(msg);

      if (this.buscarEstado === 'Todos') {
        matchesEstado = true;
      } else if (this.buscarEstado === 'Nuevo') {
        matchesEstado = esRecibido && msg.estadoLectura === 'Nuevo';
      } else if (this.buscarEstado === 'Visto') {
        matchesEstado = esRecibido && msg.estadoLectura === 'Visto';
      } else if (this.buscarEstado === 'Respondido') {
        matchesEstado = esRecibido && msg.estadoRespuesta === 'Respondido';
      } else if (this.buscarEstado === 'Enviado') {
        matchesEstado = esEnviado && msg.estado === 'Enviado';
      } else if (this.buscarEstado === 'Cancelado') {
        matchesEstado = esEnviado && msg.estado === 'Cancelado';
      } else if (this.buscarEstado === 'Eliminado') {
        matchesEstado = false;
      }

      const matchesFecha = !this.buscarFecha || msg.fecha === this.buscarFecha;

      return matchesText && matchesEstado && matchesFecha;
    });
    return list.sort((a, b) => this.compararMensajes(a, b));
  }

  get mensajesRecientes(): Mensaje[] {
    return [...this.mensajesBandeja]
      .filter(m => m.estado !== 'Eliminado')
      .sort((a, b) => this.compararMensajes(a, b))
      .slice(0, 10);
  }

  verDetallesMensaje(msg: Mensaje): void {
    this.guardarFoco();
    this.mensajeSeleccionado = msg;
    this.marcarComoVisto(msg);
    this.tiemposGenerales.push(setTimeout(() => {
      const closeBtn = document.querySelector('.details-modal-backdrop .btn-close') as HTMLElement;
      if (closeBtn) closeBtn.focus();
    }, 50));
  }

  cerrarDetalles(): void {
    this.mensajeSeleccionado = null;
    this.detalleEditandoMensaje = false;
    this.mensajeEditando = null;
    this.restaurarFoco();
  }

  marcarComoVisto(msg: Mensaje, mostrarNotif = false): void {
    if (this.esMensajeRecibido(msg)) {
      if (msg.estadoLectura !== 'Visto') {
        this.http.patch<Mensaje>(`${this.urlApi}/mensajes/${msg.id}`, { estado: 'Visto' }).subscribe({
          next: (updatedMsg) => {
            msg.estadoLectura = 'Visto';
            msg.estado = 'Visto';
            if (mostrarNotif) {
              this.mostrarNotificacion(`Documento "${msg.titulo}" marcado como visto.`, 'info');
            }
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error al marcar como visto:', err)
        });
      }
    }
  }

  eliminarMensaje(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.abrirConfirmacion({
      titulo: 'Mover a Papelera',
      mensajeInicio: '¿Deseas mover el documento "',
      elementoDestacado: msg.titulo,
      mensajeFin: '" a la papelera?',
      textoAceptar: 'Mover',
      tipo: 'danger',
      icono: 'bi-trash-fill',
      callback: () => {
        this.http.delete<Mensaje>(`${this.urlApi}/mensajes/${msg.id}`).subscribe({
          next: (response) => {
            if (this.mensajeSeleccionado && this.mensajeSeleccionado.id === msg.id) {
              this.mensajeSeleccionado = null;
            }
            this.mostrarNotificacion(`El documento "${msg.titulo}" ha sido movido a la Papelera.`, 'exito');
            this.cargarMensajesRecibidos();
          },
          error: (err) => {
            console.error(err);
            this.mostrarNotificacion('No se pudo eliminar el mensaje.', 'error');
          }
        });
      }
    });
  }

  eliminarMensajeEnviado(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!msg.confirmarEliminarSent) {
      this.mensajesBandeja.forEach(m => m.confirmarEliminarSent = false);
      msg.confirmarEliminarSent = true;
      this.cdr.detectChanges();

      this.tiemposGenerales.push(setTimeout(() => {
        if (msg.confirmarEliminarSent) {
          msg.confirmarEliminarSent = false;
          this.cdr.detectChanges();
        }
      }, 5000));
      return;
    }

    msg.confirmarEliminarSent = false;

    this.http.delete<Mensaje>(`${this.urlApi}/mensajes/${msg.id}`).subscribe({
      next: (response) => {
        if (this.mensajeSeleccionado && this.mensajeSeleccionado.id === msg.id) {
          this.mensajeSeleccionado = null;
        }
        this.mostrarNotificacion('Mensaje eliminado.', 'exito');
        this.cargarMensajesEnviados();
      },
      error: (err) => {
        console.error(err);
        this.mostrarNotificacion('No se pudo eliminar el mensaje.', 'error');
      }
    });
  }

  responderMensaje(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    msg.estadoTemporal = 'Respondiendo';
    this.mostrarNotificacion('Preparando respuesta...', 'info');
    this.cdr.detectChanges();

    this.tiemposGenerales.push(setTimeout(() => {
      msg.estadoTemporal = null;
      this.marcarComoVisto(msg);
      this.marcarComoRespondido(msg);

      this.moduloActual = 'mensaje';
      this.actualizarFechaHora();
      this.resetearFormulario();

      const remitenteLower = msg.remitente.toLowerCase();
      const match = this.usuariosDisponibles.find(u => u.toLowerCase().includes(remitenteLower));

      if (match) {
        this.usuariosDisponibles = this.usuariosDisponibles.filter(u => u !== match);
        this.usuariosSeleccionados = [match];
      } else {
        const nuevoDestinatario = `${msg.remitente} - Remitente original`;
        this.usuariosSeleccionados = [nuevoDestinatario];
      }

      this.mostrarNotificacion('Respuesta redactada. Complete los detalles y envíe el documento.', 'exito');

      const hash = '#mensaje';
      if (window.location.hash !== hash) {
        window.history.pushState({ modulo: 'mensaje' }, '', hash);
      }

      this.cdr.detectChanges();
    }, 1500));
  }

  hacerLogin(event: Event): void {
    event.preventDefault();
    if (!this.usuarioLogin.trim()) {
      this.mostrarNotificacion('Por favor ingrese su usuario o correo.', 'error');
      return;
    }
    if (!this.contrasenaLogin.trim()) {
      this.mostrarNotificacion('Por favor ingrese su contraseña.', 'error');
      return;
    }

    const payload = {
      usuario: this.usuarioLogin.trim(),
      password: this.contrasenaLogin.trim()
    };

    this.cargandoLogin = true;
    this.http.post<any>(`${this.urlApi}/auth/login`, payload).subscribe({
      next: (response) => {
        this.sesionIniciada = true;
        this.usuarioActual = {
          nombre: response.user.nombre,
          rol: response.user.rol,
          tipo: (response.user.rol === 'Administrador' ? 'admin' : 'normal') as 'admin' | 'normal'
        };

        sessionStorage.setItem('si_session_logged', 'true');
        sessionStorage.setItem('si_session_user', JSON.stringify(this.usuarioActual));

        if (response.requiresPasswordChange) {
          this.mostrarCambioObligatorioModal = true;
          this.usuarioPendienteCambio = {
            id: response.user.id,
            nombre: response.user.nombre,
            usuario: response.user.usuario,
            correo: response.user.correo || '',
            area: response.user.area || '',
            rol: response.user.rol,
            estado: 'Activo'
          };
          this.mostrarNotificacion('Debe cambiar su contraseña obligatoriamente.', 'advertencia');
        } else {
          this.mostrarNotificacion(`Sesión iniciada como ${response.user.nombre}.`, 'exito');
        }

        this.usuarioLogin = '';
        this.contrasenaLogin = '';
        this.cargandoLogin = false;

        if (this.usuarioActual.tipo === 'admin') {
          this.cargarUsuarios();
        }
        this.cargarMensajes();
        this.cargarRecordatorios();

        window.location.hash = this.moduloActual;
        window.history.replaceState({ modulo: this.moduloActual }, '', '#' + this.moduloActual);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.cargandoLogin = false;
        if (err.status === 403 || (err.error && err.error.message && err.error.message.includes('inactivo'))) {
          const msg = err.error?.message || 'El usuario se encuentra inactivo. Contacte al administrador.';
          this.mostrarNotificacion(msg, 'error');
        } else if (err.status === 401 || err.status === 404) {
          this.mostrarNotificacion('Usuario o contraseña incorrectos.', 'error');
        } else {
          this.mostrarNotificacion('No se pudo conectar con el servidor. Verifica que el backend esté activo.', 'error');
        }
      }
    });
  }

  cerrarSesion(): void {
    this.sesionIniciada = false;
    this.mostrarPerfilModal = false;
    this.mostrarCambioObligatorioModal = false;
    this.usuarioPendienteCambio = null;
    this.nuevaPassword = '';
    this.confirmarNuevaPassword = '';
    this.usuarioLogin = '';
    this.contrasenaLogin = '';
    this.usuarioActual = {
      nombre: 'Usuario del sistema',
      rol: 'Usuario',
      tipo: 'normal'
    };
    this.usuarioSeleccionadoAdmin = null;
    this.usuarioEditandoAdmin = null;
    this.modalVerUsuarioAbierto = false;
    this.modalEditarUsuarioAbierto = false;
    sessionStorage.removeItem('si_session_logged');
    sessionStorage.removeItem('si_session_user');
    window.location.hash = 'inicio';
    this.resetearFormulario();
  }

  cambiarContrasenaObligatoria(event: Event): void {
    event.preventDefault();
    if (!this.usuarioPendienteCambio) return;

    const pwd = this.nuevaPassword;
    const confirmPwd = this.confirmarNuevaPassword;

    if (!pwd) {
      this.mostrarNotificacion('La contraseña no puede estar vacía.', 'error');
      return;
    }
    if (pwd.length < 8) {
      this.mostrarNotificacion('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    if (pwd !== confirmPwd) {
      this.mostrarNotificacion('Las contraseñas no coinciden.', 'error');
      return;
    }

    this.http.patch<any>(`${this.urlApi}/usuarios/${this.usuarioPendienteCambio.id}/password`, { passwordNueva: pwd }).subscribe({
      next: () => {
        sessionStorage.setItem('si_session_logged', 'true');
        sessionStorage.setItem('si_session_user', JSON.stringify(this.usuarioActual));

        this.mostrarCambioObligatorioModal = false;
        this.usuarioPendienteCambio = null;
        this.nuevaPassword = '';
        this.confirmarNuevaPassword = '';

        this.mostrarNotificacion('Contraseña actualizada correctamente. Bienvenido al sistema.', 'exito');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        if (err.status === 404) {
          this.mostrarNotificacion('Usuario no encontrado en el servidor. No se pudo cambiar la contraseña.', 'error');
        } else {
          this.mostrarNotificacion('Error al actualizar la contraseña en el servidor.', 'error');
        }
      }
    });
  }

  verPerfilUsuario(): void {
    this.guardarFoco();
    this.mostrarPerfilModal = true;
    this.tiemposGenerales.push(setTimeout(() => {
      const closeBtn = document.querySelector('.profile-modal .btn-close') as HTMLElement;
      if (closeBtn) closeBtn.focus();
    }, 50));
  }

  cerrarPerfilUsuario(): void {
    this.mostrarPerfilModal = false;
    this.restaurarFoco();
  }

  get usuariosFiltrados(): UsuarioSistema[] {
    return this.usuariosSistema.filter(u => {
      const matchesSearch = !this.buscarUsuarioAdmin.trim() ||
        u.nombre.toLowerCase().includes(this.buscarUsuarioAdmin.toLowerCase()) ||
        u.usuario.toLowerCase().includes(this.buscarUsuarioAdmin.toLowerCase()) ||
        u.correo.toLowerCase().includes(this.buscarUsuarioAdmin.toLowerCase()) ||
        u.area.toLowerCase().includes(this.buscarUsuarioAdmin.toLowerCase()) ||
        u.rol.toLowerCase().includes(this.buscarUsuarioAdmin.toLowerCase()) ||
        u.estado.toLowerCase().includes(this.buscarUsuarioAdmin.toLowerCase());

      const matchesRol = this.filtroRolAdmin === 'Todos' || u.rol === this.filtroRolAdmin;
      const matchesEstado = this.filtroEstadoAdmin === 'Todos' || u.estado === this.filtroEstadoAdmin;

      return matchesSearch && matchesRol && matchesEstado;
    });
  }

  seleccionarUsuarioAdmin(usuario: UsuarioSistema): void {
    this.guardarFoco();
    this.usuarioSeleccionadoAdmin = usuario;
    this.usuarioEditandoAdmin = null;
    this.modalVerUsuarioAbierto = true;
    this.tiemposGenerales.push(setTimeout(() => {
      const closeBtn = document.querySelector('.modal-card .btn-close') as HTMLElement;
      if (closeBtn) closeBtn.focus();
    }, 50));
  }

  cerrarModalVerUsuario(): void {
    this.modalVerUsuarioAbierto = false;
    this.usuarioSeleccionadoAdmin = null;
    this.restaurarFoco();
  }

  abrirModalEditarUsuario(usuario: UsuarioSistema): void {
    this.guardarFoco();
    this.usuarioEditandoAdmin = { ...usuario };
    this.modalEditarUsuarioAbierto = true;
    this.modalVerUsuarioAbierto = false;
    this.verContrasenaEdicionUsuario = false;
    this.tiemposGenerales.push(setTimeout(() => {
      const firstInput = document.querySelector('#editNombre') as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 50));
  }

  abrirCrearUsuarioAdmin(): void {
    this.guardarFoco();
    this.usuarioEditandoAdmin = {
      id: 0,
      nombre: '',
      usuario: '',
      correo: '',
      area: '',
      rol: 'Usuario',
      estado: 'Activo',
      password: '',
      requiereCambioPassword: false
    };
    this.modalEditarUsuarioAbierto = true;
    this.modalVerUsuarioAbierto = false;
    this.verContrasenaEdicionUsuario = false;
    this.tiemposGenerales.push(setTimeout(() => {
      const firstInput = document.querySelector('#editNombre') as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 50));
  }

  cerrarModalEditarUsuario(): void {
    if (this.usuarioEditandoAdmin) {
      const original = this.usuariosSistema.find(u => u.id === this.usuarioEditandoAdmin!.id);
      if (original) {
        const isDirty = this.usuarioEditandoAdmin.nombre !== original.nombre ||
          this.usuarioEditandoAdmin.usuario !== original.usuario ||
          this.usuarioEditandoAdmin.correo !== original.correo ||
          this.usuarioEditandoAdmin.area !== original.area ||
          this.usuarioEditandoAdmin.rol !== original.rol ||
          this.usuarioEditandoAdmin.estado !== original.estado ||
          (this.usuarioEditandoAdmin.password && this.usuarioEditandoAdmin.password !== original.password);
        if (isDirty) {
          this.abrirConfirmacion({
            titulo: 'Cambios sin guardar',
            mensajeInicio: 'Tiene cambios sin guardar en el usuario. ¿Deseas descartar los cambios?',
            textoAceptar: 'Descartar',
            tipo: 'warning',
            icono: 'bi-exclamation-triangle-fill',
            callback: () => {
              this.modalEditarUsuarioAbierto = false;
              this.usuarioEditandoAdmin = null;
            }
          });
          return;
        }
      }
    }
    this.modalEditarUsuarioAbierto = false;
    this.usuarioEditandoAdmin = null;
    this.verContrasenaEdicionUsuario = false;
    this.restaurarFoco();
  }

  cancelarEdicionUsuarioAdmin(): void {
    this.cerrarModalEditarUsuario();
  }

  clicIniciadoEnBackdrop = false;

  alIniciarClickBackdrop(event: MouseEvent): void {
    this.clicIniciadoEnBackdrop = (event.target === event.currentTarget);
  }

  alTerminarClickBackdropEditarUsuario(event: MouseEvent): void {
    // In edit mode (important form), prefer closing only via X, Cancel, or Save.
    this.clicIniciadoEnBackdrop = false;
  }

  alTerminarClickBackdropVerUsuario(event: MouseEvent): void {
    if (this.clicIniciadoEnBackdrop && event.target === event.currentTarget) {
      this.cerrarModalVerUsuario();
    }
    this.clicIniciadoEnBackdrop = false;
  }

  alTerminarClickBackdropPerfil(event: MouseEvent): void {
    if (this.clicIniciadoEnBackdrop && event.target === event.currentTarget) {
      this.cerrarPerfilUsuario();
    }
    this.clicIniciadoEnBackdrop = false;
  }

  alTerminarClickBackdropCalendario(event: MouseEvent): void {
    if (this.clicIniciadoEnBackdrop && event.target === event.currentTarget) {
      this.cerrarCalendario();
    }
    this.clicIniciadoEnBackdrop = false;
  }

  alTerminarClickBackdropDetalle(event: MouseEvent): void {
    if (this.detalleEditandoMensaje) {
      // In edit mode, do not close via backdrop click to avoid losing edits!
      this.clicIniciadoEnBackdrop = false;
      return;
    }
    if (this.clicIniciadoEnBackdrop && event.target === event.currentTarget) {
      this.cerrarDetalles();
    }
    this.clicIniciadoEnBackdrop = false;
  }

  guardarCambiosUsuarioAdmin(): void {
    if (!this.usuarioEditandoAdmin) return;

    if (!this.usuarioEditandoAdmin.nombre.trim()) {
      this.mostrarNotificacion('El nombre no puede estar vacío.', 'error');
      return;
    }
    if (!this.usuarioEditandoAdmin.usuario.trim()) {
      this.mostrarNotificacion('El usuario no puede estar vacío.', 'error');
      return;
    }
    
    const correo = (this.usuarioEditandoAdmin.correo || '').trim();
    if (!correo) {
      this.mostrarNotificacion('El correo electrónico es obligatorio.', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      this.mostrarNotificacion('El formato del correo electrónico no es válido.', 'error');
      return;
    }

    if (!this.usuarioEditandoAdmin.area || !this.usuarioEditandoAdmin.area.trim()) {
      this.mostrarNotificacion('El área de adscripción es obligatoria.', 'error');
      return;
    }

    if (!this.usuarioEditandoAdmin.rol.trim()) {
      this.mostrarNotificacion('El rol no puede estar vacío.', 'error');
      return;
    }
    if (this.usuarioEditandoAdmin.estado !== 'Activo' && this.usuarioEditandoAdmin.estado !== 'Inactivo') {
      this.mostrarNotificacion('El estado seleccionado no es válido.', 'error');
      return;
    }

    if (this.usuarioEditandoAdmin.id === 0) {
      // Create mode
      if (this.usuarioEditandoAdmin.password) {
        const pwd = this.usuarioEditandoAdmin.password.trim();
        if (pwd.length > 0 && pwd.length < 8) {
          this.mostrarNotificacion('La contraseña debe tener al menos 8 caracteres.', 'error');
          return;
        }
      }

      const payload = {
        nombre: this.usuarioEditandoAdmin.nombre.trim(),
        usuario: this.usuarioEditandoAdmin.usuario.trim(),
        correo: correo,
        area: this.usuarioEditandoAdmin.area.trim(),
        rol: this.usuarioEditandoAdmin.rol,
        estado: this.usuarioEditandoAdmin.estado,
        password: this.usuarioEditandoAdmin.password || undefined,
        requiereCambioPassword: this.usuarioEditandoAdmin.requiereCambioPassword ?? false
      };

      this.cargandoUsuario = true;
      this.http.post<UsuarioSistema>(`${this.urlApi}/usuarios`, payload).subscribe({
        next: (response) => {
          this.mostrarNotificacion('Usuario creado correctamente.', 'exito');
          this.modalEditarUsuarioAbierto = false;
          this.usuarioEditandoAdmin = null;
          this.cargandoUsuario = false;
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error(err);
          this.cargandoUsuario = false;
          this.manejarErrorHttp(err, 'Error al crear el usuario en el servidor.');
        }
      });
    } else {
      // Edit mode
      const newPwd = this.usuarioEditandoAdmin.password?.trim();
      if (newPwd && newPwd.length < 8) {
        this.mostrarNotificacion('La contraseña debe tener al menos 8 caracteres.', 'error');
        return;
      }

      const payload = {
        nombre: this.usuarioEditandoAdmin.nombre.trim(),
        usuario: this.usuarioEditandoAdmin.usuario.trim(),
        correo: correo,
        area: this.usuarioEditandoAdmin.area.trim(),
        rol: this.usuarioEditandoAdmin.rol,
        estado: this.usuarioEditandoAdmin.estado,
        requiereCambioPassword: this.usuarioEditandoAdmin.requiereCambioPassword ?? false
      };

      const userId = this.usuarioEditandoAdmin.id;

      this.cargandoUsuario = true;
      this.http.patch<UsuarioSistema>(`${this.urlApi}/usuarios/${userId}`, payload).subscribe({
        next: (response) => {
          if (newPwd) {
            // Update password
            this.http.patch<any>(`${this.urlApi}/usuarios/${userId}/password`, { passwordNueva: newPwd }).subscribe({
              next: () => {
                this.mostrarNotificacion('Usuario y contraseña actualizados correctamente.', 'exito');
                this.modalEditarUsuarioAbierto = false;
                this.usuarioEditandoAdmin = null;
                this.cargandoUsuario = false;
                this.cargarUsuarios();
              },
              error: (err) => {
                console.error(err);
                this.cargandoUsuario = false;
                this.manejarErrorHttp(err, 'Usuario actualizado, pero falló el cambio de contraseña.', 'advertencia');
                this.modalEditarUsuarioAbierto = false;
                this.usuarioEditandoAdmin = null;
                this.cargarUsuarios();
              }
            });
          } else {
            this.mostrarNotificacion('Usuario actualizado correctamente.', 'exito');
            this.modalEditarUsuarioAbierto = false;
            this.usuarioEditandoAdmin = null;
            this.cargandoUsuario = false;
            this.cargarUsuarios();
          }
        },
        error: (err) => {
          console.error(err);
          this.cargandoUsuario = false;
          this.manejarErrorHttp(err, 'Error al actualizar el usuario en el servidor.');
        }
      });
    }
  }

  generarContrasenaEdicionAdmin(): void {
    if (!this.usuarioEditandoAdmin) return;
    const num = Math.floor(1000 + Math.random() * 9000);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter1 = chars[Math.floor(Math.random() * chars.length)];
    const letter2 = chars[Math.floor(Math.random() * chars.length)];
    const password = `Temp-${num}-${letter1}${letter2}`;
    this.usuarioEditandoAdmin.password = password;
    this.verContrasenaEdicionUsuario = true;
    this.mostrarNotificacion('Nueva contraseña aleatoria generada.', 'exito');
  }

  cambiarEstadoUsuario(usuario: UsuarioSistema): void {
    usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';

    if (this.usuarioEditandoAdmin && this.usuarioEditandoAdmin.id === usuario.id) {
      this.usuarioEditandoAdmin.estado = usuario.estado;
    }

    this.actualizarUsuariosDisponibles();

    if (usuario.estado === 'Activo') {
      this.mostrarNotificacion('Usuario activado correctamente.', 'exito');
    } else {
      this.mostrarNotificacion('Usuario desactivado correctamente.', 'exito');
    }
  }

  alternarEstadoUsuario(usuario: UsuarioSistema, event?: Event): void {
    this.solicitarAlternarEstadoUsuario(usuario, event);
  }

  solicitarAlternarEstadoUsuario(usuario: UsuarioSistema, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const accion = usuario.estado === 'Activo' ? 'desactivar' : 'activar';
    const textoAceptarConfirmacion = usuario.estado === 'Activo' ? 'Desactivar' : 'Activar';
    const colorTipo = usuario.estado === 'Activo' ? 'danger' : 'success';
    const icono = usuario.estado === 'Activo' ? 'bi-person-x-fill' : 'bi-person-check-fill';

    this.abrirConfirmacion({
      titulo: 'Confirmar Acción',
      mensajeInicio: `¿Deseas ${accion} al usuario "`,
      elementoDestacado: usuario.nombre,
      mensajeFin: '"?',
      textoAceptar: textoAceptarConfirmacion,
      tipo: colorTipo,
      icono: icono,
      callback: () => {
        this.cargandoEstadoUsuario = true;
        this.http.patch<any>(`${this.urlApi}/usuarios/${usuario.id}`, { estado: nuevoEstado }).subscribe({
          next: (response) => {
            const msg = nuevoEstado === 'Activo' ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.';
            this.mostrarNotificacion(msg, 'exito');
            this.cargandoEstadoUsuario = false;
            this.cargarUsuarios();
          },
          error: (err) => {
            console.error(err);
            const errMsg = nuevoEstado === 'Activo' ? 'Error al activar el usuario.' : 'Error al desactivar el usuario.';
            this.cargandoEstadoUsuario = false;
            this.manejarErrorHttp(err, errMsg);
          }
        });
      }
    });
  }

  abrirConfirmacion(opciones: {
    titulo: string;
    mensajeInicio: string;
    elementoDestacado?: string;
    mensajeFin?: string;
    textoAceptar: string;
    tipo?: 'danger' | 'success' | 'warning' | 'primary';
    icono?: string;
    callback: () => void;
  }): void {
    this.confirmacionTitulo = opciones.titulo;
    this.confirmacionMensajeInicio = opciones.mensajeInicio;
    this.confirmacionElementoDestacado = opciones.elementoDestacado || '';
    this.confirmacionMensajeFin = opciones.mensajeFin || '';
    this.confirmacionTextoAceptar = opciones.textoAceptar;
    this.confirmacionTipo = opciones.tipo || 'warning';
    this.confirmacionIcono = opciones.icono || 'bi-exclamation-triangle-fill';
    this.confirmacionCallback = opciones.callback;
    this.confirmacionModalAbierto = true;
  }

  cancelarConfirmacion(): void {
    this.confirmacionModalAbierto = false;
    this.confirmacionCallback = null;
  }

  aceptarConfirmacion(): void {
    if (this.confirmacionCallback) {
      this.confirmacionCallback();
    }
    this.confirmacionModalAbierto = false;
    this.confirmacionCallback = null;
  }

  cargarUsuarios(): void {
    this.http.get<UsuarioSistema[]>(`${this.urlApi}/usuarios`).subscribe({
      next: (users) => {
        this.usuariosSistema = users;
        this.actualizarUsuariosDisponibles();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.manejarErrorHttp(err, 'No se pudo conectar con el servidor. Verifica que el backend esté activo.');
      }
    });
  }

  cargarMensajes(): void {
    this.http.get<Mensaje[]>(`${this.urlApi}/mensajes`).subscribe({
      next: (mensajes) => {
        this.mensajesBandeja = mensajes;
        this.asegurarFechaHoraMensajes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.manejarErrorHttp(err, 'No se pudieron cargar los mensajes.');
      }
    });
  }

  normalizarTexto(txt: string): string {
    return txt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  cargarFormatos(): void {
    this.http.get<DocumentoFormato[]>(`${this.urlApi}/formatos`).subscribe({
      next: (formatos) => {
        this.categoriasFormatos.forEach(cat => {
          this.documentosFormatos[cat] = [];
        });

        formatos.forEach(f => {
          const catNormalizada = this.normalizarTexto(f.categoria || '');
          const catEncontrada = this.categoriasFormatos.find(
            cat => this.normalizarTexto(cat) === catNormalizada
          );

          if (catEncontrada) {
            this.documentosFormatos[catEncontrada].push(f);
          } else if (this.documentosFormatos[f.categoria || 'Formatos']) {
            this.documentosFormatos[f.categoria || 'Formatos'].push(f);
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.manejarErrorHttp(err, 'No se pudieron cargar los formatos.');
      }
    });
  }

  cargarRecordatorios(): void {
    this.http.get<EventoCalendario[]>(`${this.urlApi}/recordatorios`).subscribe({
      next: (recordatorios) => {
        this.recordatoriosCalendario = recordatorios;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.manejarErrorHttp(err, 'No se pudieron cargar los recordatorios.');
      }
    });
  }

  cargarMensajesRecibidos(): void {
    this.http.get<Mensaje[]>(`${this.urlApi}/mensajes/recibidos`).subscribe({
      next: (recibidos) => {
        const enviados = this.mensajesBandeja.filter(m => this.esMensajeEnviado(m));
        const idsRecibidos = new Set(recibidos.map(m => m.id));
        const filtradosEnviados = enviados.filter(m => !idsRecibidos.has(m.id));
        this.mensajesBandeja = [...recibidos, ...filtradosEnviados];
        this.asegurarFechaHoraMensajes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.manejarErrorHttp(err, 'No se pudieron cargar los mensajes.');
      }
    });
  }

  cargarMensajesEnviados(): void {
    this.http.get<Mensaje[]>(`${this.urlApi}/mensajes/enviados`).subscribe({
      next: (enviados) => {
        const recibidos = this.mensajesBandeja.filter(m => this.esMensajeRecibido(m));
        const idsEnviados = new Set(enviados.map(m => m.id));
        const filtradosRecibidos = recibidos.filter(m => !idsEnviados.has(m.id));
        this.mensajesBandeja = [...filtradosRecibidos, ...enviados];
        this.asegurarFechaHoraMensajes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.manejarErrorHttp(err, 'No se pudieron cargar los mensajes.');
      }
    });
  }

  cargarDatosModulo(modulo: string): void {
    if (modulo === 'administracion' && this.usuarioActual.tipo === 'admin') {
      this.cargarUsuarios();
    } else if (modulo === 'bandeja') {
      this.cargarMensajesRecibidos();
    } else if (modulo === 'mensaje') {
      this.cargarMensajesEnviados();
    } else if (modulo === 'inicio') {
      this.cargarMensajes();
      this.cargarRecordatorios();
    } else if (modulo === 'formatos') {
      this.cargarFormatos();
    }
  }

  generarPasswordTemporal(usuario: UsuarioSistema): void {
    const num = Math.floor(1000 + Math.random() * 9000);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter1 = chars[Math.floor(Math.random() * chars.length)];
    const letter2 = chars[Math.floor(Math.random() * chars.length)];
    const password = `Temp-${num}-${letter1}${letter2}`;

    usuario.passwordTemporal = password;

    if (this.usuarioEditandoAdmin && this.usuarioEditandoAdmin.id === usuario.id) {
      this.usuarioEditandoAdmin.passwordTemporal = password;
    }

    this.mostrarNotificacion('Contraseña temporal generada con éxito.', 'exito');
  }

  descargarPdfUsuario(usuario: UsuarioSistema): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      this.mostrarNotificacion('Error al abrir la ventana de impresión. Por favor permita las ventanas emergentes.', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha de Usuario - ${usuario.nombre}</title>
        <style>
          body {
            font-family: 'Montserrat', 'Inter', sans-serif;
            color: #333333;
            margin: 40px;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #5C2238;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 {
            color: #5C2238;
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            font-weight: 700;
          }
          .header .logo-text {
            font-size: 14px;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
          }
          .info-item {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .info-label {
            font-size: 11px;
            color: #777;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
          }
          .info-value {
            font-size: 15px;
            font-weight: 600;
            color: #111;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #888;
            line-height: 1.4;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Ficha de Información del Usuario</h1>
            <div style="font-size: 12px; color: #555; margin-top: 5px;">SIIntranet - Portal de Gestión del Poder Legislativo</div>
          </div>
          <div class="logo-text">GOBIERNO DEL ESTADO DE MÉXICO</div>
        </div>

        <div class="info-grid">
          <div class="info-item" style="grid-column: span 2;">
            <div class="info-label">Nombre Completo</div>
            <div class="info-value" style="font-size: 18px; font-weight: bold; color: #5C2238;">${usuario.nombre}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Nombre de Usuario</div>
            <div class="info-value" style="font-family: monospace;">${usuario.usuario}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Rol / Perfil</div>
            <div class="info-value">${usuario.rol}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Correo Electrónico</div>
            <div class="info-value">${usuario.correo || 'Pendiente'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Área / Adscripción</div>
            <div class="info-value">${usuario.area || 'Pendiente'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Estado de la Cuenta</div>
            <div class="info-value" style="font-weight: bold; color: ${usuario.estado === 'Activo' ? '#166534' : '#991b1b'};">${usuario.estado}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Fecha de Emisión</div>
            <div class="info-value">${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}</div>
          </div>
        </div>

        <div class="footer">
          Documento emitido de manera digital e institucional a través del módulo de administración de SIIntranet.<br>
          © 2026 Poder Legislativo del Estado de México. Todos los derechos reservados.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  esMensajeEnviado(msg: Mensaje): boolean {
    if (msg.tipoMensaje === 'enviado') return true;
    if (msg.tipoMensaje === 'recibido') return false;
    return msg.remitente === this.usuarioActual.nombre;
  }

  esMensajeRecibido(msg: Mensaje): boolean {
    if (msg.tipoMensaje === 'recibido') return true;
    if (msg.tipoMensaje === 'enviado') return false;
    return msg.remitente !== this.usuarioActual.nombre;
  }

  obtenerResumenParticipantesMensaje(msg: Mensaje): string {
    if (this.esMensajeEnviado(msg)) {
      const resumen = this.obtenerDestinatariosResumen(msg, 2);
      const extra = this.obtenerCantidadDestinatariosExtra(msg, 2);
      return `Para: ${resumen}${extra > 0 ? ` y ${extra} más` : ''}`;
    }
    return `De: ${msg.remitente}`;
  }

  puedeResponderMensaje(msg: Mensaje | null): boolean {
    if (!msg) return false;
    if (msg.estadoTemporal) return false;
    if (msg.estado === 'Eliminado' || msg.estado === 'Cancelado') return false;
    return this.esMensajeRecibido(msg);
  }

  obtenerEstadosMensaje(msg: Mensaje): string[] {
    if (msg.estadoTemporal) {
      return [msg.estadoTemporal];
    }
    if (msg.estado === 'Eliminado') {
      return ['Eliminado'];
    }
    if (msg.estado === 'Cancelado') {
      return ['Cancelado'];
    }
    if (this.esMensajeEnviado(msg)) {
      if (msg.estado === 'Enviando') {
        return ['Enviando'];
      }
      return ['Enviado'];
    } else {
      const states: string[] = [];
      if (msg.estadoLectura === 'Nuevo') {
        states.push('Nuevo');
      } else {
        states.push('Visto');
      }
      if (msg.estadoRespuesta === 'Respondido') {
        states.push('Respondido');
      }
      return states;
    }
  }

  marcarComoRespondido(msg: Mensaje): void {
    if (this.esMensajeRecibido(msg)) {
      this.http.patch<Mensaje>(`${this.urlApi}/mensajes/${msg.id}`, { estado: 'Respondido' }).subscribe({
        next: (updatedMsg) => {
          msg.estadoLectura = 'Visto';
          msg.estadoRespuesta = 'Respondido';
          msg.estado = 'Respondido';
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al marcar como respondido:', err)
      });
    }
  }

  cancelarMensaje(msg: Mensaje): void {
    if (msg.estado === 'Enviando') {
      this.cancelarEnvio(msg.id);
      return;
    }
    if (msg.estado === 'Enviado') {
      msg.estadoTemporal = 'Cancelando';
      this.mostrarNotificacion('Cancelando envío del documento...', 'info');
      this.cdr.detectChanges();
      this.tiemposGenerales.push(setTimeout(() => {
        msg.estadoTemporal = null;
        msg.estado = 'Cancelado';
        this.mostrarNotificacion('Envío cancelado correctamente.', 'exito');
        this.cdr.detectChanges();
      }, 1500));
    }
  }

  abrirCalendario(): void {
    this.cargarMensajes();
    this.cargarRecordatorios();
    this.guardarFoco();
    this.calendarioModalAbierto = true;
    this.filtroEventosCalendario = 'Todos';
    this.fechaBusquedaCalendario = this.fechaSeleccionadaCalendario;
    this.cdr.detectChanges();
    this.tiemposGenerales.push(setTimeout(() => {
      const closeBtn = document.querySelector('.calendar-modal .btn-close') as HTMLElement;
      if (closeBtn) closeBtn.focus();
    }, 50));
  }

  cerrarCalendario(): void {
    const desc = (this.nuevoRecordatorioCalendario || '').trim();
    const hora = (this.nuevoRecordatorioHoraCalendario || '').trim();
    if (desc || hora) {
      this.nuevoRecordatorioCalendario = '';
      this.nuevoRecordatorioHoraCalendario = '';
      this.mostrarNotificacion('Se descartó el recordatorio no guardado.', 'info');
    }
    this.calendarioModalAbierto = false;
    this.cdr.detectChanges();
    this.restaurarFoco();
  }

  puedeEditarMensajeEnviado(msg: Mensaje | null): boolean {
    if (!msg) return false;
    if (msg.estadoTemporal) return false;
    if (!this.esMensajeEnviado(msg)) return false;
    const allowed = ['Enviado', 'Visto', 'Nuevo', 'Respondido'];
    return allowed.includes(msg.estado);
  }

  activarEdicionDetalle(): void {
    if (!this.mensajeSeleccionado) return;
    const msg = this.mensajeSeleccionado;
    this.mensajeEditando = msg;
    
    if (!msg.fecha) {
      msg.fecha = this.formatearFechaLocal(new Date());
    }
    if (!msg.hora) {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      msg.hora = `${h}:${m}`;
    }
    
    this.editarMensajeTitulo = msg.titulo;
    this.editarMensajeDescripcion = msg.descripcion;
    this.editarMensajeFecha = msg.fecha;
    this.editarMensajeHora = msg.hora;
    
    const actuales = this.normalizarListaDestinatarios(msg.destinatarios);
    this.editarMensajeDestinatariosSeleccionados = [...actuales];
    
    const todosUsuarios = this.usuariosSistema.map(u => u.nombre);
    const pool = Array.from(new Set([
      ...todosUsuarios,
      'Administrador del sistema',
      'María Rodríguez López',
      'Juan Pérez García',
      'Dirección de Finanzas',
      'Dirección de Informática',
      'Dirección de Recursos Materiales'
    ]));
    
    this.editarMensajeDestinatariosDisponibles = pool.filter(u => !actuales.includes(u)).sort();
    
    this.editarMensajeDocumentos = this.normalizarListaDocumentos(msg.documento);
    this.editarMensajeNuevosArchivos = [];
    
    this.detalleEditandoMensaje = true;
    this.cdr.detectChanges();
  }

  cancelarEdicionDetalle(): void {
    this.detalleEditandoMensaje = false;
    this.mensajeEditando = null;
    this.cdr.detectChanges();
  }

  eliminarDocumentoExistenteEditor(index: number): void {
    this.editarMensajeDocumentos.splice(index, 1);
    this.cdr.detectChanges();
  }

  eliminarNuevoArchivoEditor(index: number): void {
    this.editarMensajeNuevosArchivos.splice(index, 1);
    this.cdr.detectChanges();
  }

  alSeleccionarNuevoArchivoEditor(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        this.editarMensajeNuevosArchivos.push(input.files[i]);
      }
    }
    this.cdr.detectChanges();
  }

  guardarCambiosMensajeEnviado(): void {
    if (!this.mensajeEditando) return;

    if (!this.editarMensajeTitulo.trim()) {
      this.mostrarNotificacion('El título no puede estar vacío.', 'error');
      return;
    }

    if (!this.editarMensajeDescripcion || !this.editarMensajeDescripcion.trim()) {
      this.mostrarNotificacion('La descripción no puede estar vacía.', 'error');
      return;
    }

    if (this.editarMensajeDestinatariosSeleccionados.length === 0) {
      this.mostrarNotificacion('Debe haber al menos un destinatario.', 'error');
      return;
    }

    const todosDocNames = [
      ...this.editarMensajeDocumentos,
      ...this.editarMensajeNuevosArchivos.map(f => f.name)
    ];

    const finalDocumento = todosDocNames.length > 0
      ? todosDocNames.join(', ')
      : 'Sin adjunto';

    const body = {
      titulo: this.editarMensajeTitulo.trim(),
      descripcion: this.editarMensajeDescripcion.trim(),
      destinatarios: this.editarMensajeDestinatariosSeleccionados.join(', '),
      documento: finalDocumento,
      estado: this.mensajeEditando.estado
    };

    this.cargandoEdicionMensaje = true;
    this.http.patch<Mensaje>(`${this.urlApi}/mensajes/${this.mensajeEditando.id}`, body).subscribe({
      next: (response) => {
        this.mostrarNotificacion('Mensaje enviado actualizado con éxito.', 'exito');
        this.detalleEditandoMensaje = false;
        this.cargandoEdicionMensaje = false;
        this.mensajeEditando = null;
        this.mensajeSeleccionado = response;
        this.cargarMensajesEnviados();
      },
      error: (err) => {
        console.error(err);
        this.cargandoEdicionMensaje = false;
        this.mostrarNotificacion('No se pudieron guardar los cambios del mensaje.', 'error');
      }
    });
  }

  editarMensajeBuscarDestinatario = '';
  editarMensajeDestinatariosDisponibles: string[] = [];
  editarMensajeDestinatariosSeleccionados: string[] = [];
  usuariosDisponiblesMarcadosEdicion: string[] = [];
  destinatariosMarcadosEdicion: string[] = [];

  pasarEdit(): void {
    if (this.usuariosDisponiblesMarcadosEdicion.length === 0) return;
    const aMover = [...this.usuariosDisponiblesMarcadosEdicion];
    this.editarMensajeDestinatariosSeleccionados = [...this.editarMensajeDestinatariosSeleccionados, ...aMover];
    this.editarMensajeDestinatariosDisponibles = this.editarMensajeDestinatariosDisponibles.filter(u => !aMover.includes(u));
    this.usuariosDisponiblesMarcadosEdicion = [];
    this.cdr.detectChanges();
  }

  quitarEdit(): void {
    if (this.destinatariosMarcadosEdicion.length === 0) return;
    const aMover = [...this.destinatariosMarcadosEdicion];
    this.editarMensajeDestinatariosDisponibles = [...this.editarMensajeDestinatariosDisponibles, ...aMover].sort();
    this.editarMensajeDestinatariosSeleccionados = this.editarMensajeDestinatariosSeleccionados.filter(u => !aMover.includes(u));
    this.destinatariosMarcadosEdicion = [];
    this.cdr.detectChanges();
  }

  pasarTodosEdit(): void {
    this.editarMensajeDestinatariosSeleccionados = [...this.editarMensajeDestinatariosSeleccionados, ...this.editarMensajeDestinatariosDisponibles];
    this.editarMensajeDestinatariosDisponibles = [];
    this.usuariosDisponiblesMarcadosEdicion = [];
    this.cdr.detectChanges();
  }

  quitarTodosEdit(): void {
    this.editarMensajeDestinatariosDisponibles = [...this.editarMensajeDestinatariosDisponibles, ...this.editarMensajeDestinatariosSeleccionados].sort();
    this.editarMensajeDestinatariosSeleccionados = [];
    this.destinatariosMarcadosEdicion = [];
    this.cdr.detectChanges();
  }

  pasarDirectoEdit(usuario: string): void {
    if (this.editarMensajeDestinatariosDisponibles.includes(usuario)) {
      this.editarMensajeDestinatariosSeleccionados = [...this.editarMensajeDestinatariosSeleccionados, usuario];
      this.editarMensajeDestinatariosDisponibles = this.editarMensajeDestinatariosDisponibles.filter(u => u !== usuario);
    }
    this.usuariosDisponiblesMarcadosEdicion = this.usuariosDisponiblesMarcadosEdicion.filter(u => u !== usuario);
  }

  quitarDirectoEdit(usuario: string): void {
    if (!this.editarMensajeDestinatariosDisponibles.includes(usuario)) {
      this.editarMensajeDestinatariosDisponibles = [...this.editarMensajeDestinatariosDisponibles, usuario].sort();
      this.editarMensajeDestinatariosSeleccionados = this.editarMensajeDestinatariosSeleccionados.filter(u => u !== usuario);
    }
    this.destinatariosMarcadosEdicion = this.destinatariosMarcadosEdicion.filter(u => u !== usuario);
  }

  irAFechaCalendario(): void {
    if (!this.fechaBusquedaCalendario) return;
    const partes = this.fechaBusquedaCalendario.split('-');
    if (partes.length === 3) {
      const anio = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const dia = parseInt(partes[2], 10);
      if (!isNaN(anio) && !isNaN(mes) && !isNaN(dia)) {
        this.anioCalendario = anio;
        this.mesCalendario = mes;
        this.fechaSeleccionadaCalendario = this.fechaBusquedaCalendario;
        this.cdr.detectChanges();
      }
    }
  }

  get eventosFechaSeleccionadaFiltrados(): EventoCalendario[] {
    const todos = this.obtenerEventosPorFecha(this.fechaSeleccionadaCalendario);

    const filtrados = todos.filter(ev => {
      if (this.filtroEventosCalendario === 'Todos') return true;
      if (this.filtroEventosCalendario === 'Mensajes') return ev.tipo === 'recibido' || ev.tipo === 'enviado';
      if (this.filtroEventosCalendario === 'Recordatorios') return ev.tipo === 'recordatorio';
      return true;
    });

    return [...filtrados].sort((a, b) => this.compararEventos(a, b));
  }

  inicializarDatosPrueba(): void {
    this.usuariosSistema = [];
    this.mensajesBandeja = [];
  }

  compararMensajes(a: Mensaje, b: Mensaje): number {
    const aEsNuevo = a.estado === 'Nuevo' || a.estadoLectura === 'Nuevo';
    const bEsNuevo = b.estado === 'Nuevo' || b.estadoLectura === 'Nuevo';

    if (aEsNuevo && !bEsNuevo) return -1;
    if (!aEsNuevo && bEsNuevo) return 1;

    const datetimeA = `${a.fecha || ''}T${a.hora || ''}`;
    const datetimeB = `${b.fecha || ''}T${b.hora || ''}`;
    return datetimeB.localeCompare(datetimeA);
  }

  compararEventos(a: EventoCalendario, b: EventoCalendario): number {
    const aMsg = a.mensajeAsociado;
    const bMsg = b.mensajeAsociado;

    const aEsNuevo = aMsg ? (aMsg.estado === 'Nuevo' || aMsg.estadoLectura === 'Nuevo') : false;
    const bEsNuevo = bMsg ? (bMsg.estado === 'Nuevo' || bMsg.estadoLectura === 'Nuevo') : false;

    if (aEsNuevo && !bEsNuevo) return -1;
    if (!aEsNuevo && bEsNuevo) return 1;

    const timeA = a.hora || '00:00';
    const timeB = b.hora || '00:00';
    const datetimeA = `${a.fecha}T${timeA}`;
    const datetimeB = `${b.fecha}T${timeB}`;
    return datetimeB.localeCompare(datetimeA);
  }

  normalizarListaDestinatarios(destinatarios: string): string[] {
    if (!destinatarios) return [];
    return destinatarios.split(',').map(d => d.trim()).filter(d => d.length > 0);
  }

  obtenerDestinatariosResumen(msg: Mensaje | null, limite = 2): string {
    if (!msg || !msg.destinatarios) return '';
    const list = this.normalizarListaDestinatarios(msg.destinatarios);
    if (list.length === 0) return '';
    return list.slice(0, limite).join(', ');
  }

  obtenerCantidadDestinatariosExtra(msg: Mensaje | null, limite = 2): number {
    if (!msg || !msg.destinatarios) return 0;
    const list = this.normalizarListaDestinatarios(msg.destinatarios);
    return Math.max(0, list.length - limite);
  }

  normalizarListaDocumentos(documento: string): string[] {
    if (!documento || documento === 'Sin adjunto') return [];
    return documento.split(',').map(d => d.trim()).filter(d => d.length > 0);
  }

  obtenerCantidadDocumentosExtra(msg: Mensaje | null, limite = 2): number {
    if (!msg || !msg.documento || msg.documento === 'Sin adjunto') return 0;
    const list = this.normalizarListaDocumentos(msg.documento);
    return Math.max(0, list.length - limite);
  }

  validarLongitudRecordatorio(texto: string): boolean {
    if (!texto) return false;
    return texto.trim().length <= 150;
  }

  abrirMensajeDesdeVista(msg: Mensaje, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.verDetallesMensaje(msg);
  }

  guardarFoco(): void {
    if (!this.ultimoElementoEnfocado) {
      this.ultimoElementoEnfocado = document.activeElement as HTMLElement;
    }
  }

  restaurarFoco(): void {
    if (this.ultimoElementoEnfocado) {
      this.ultimoElementoEnfocado.focus();
      this.ultimoElementoEnfocado = null;
    }
  }

  esCampoEditable(el: any): boolean {
    if (!el) return false;
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || el.isContentEditable;
  }

  manejarTecladoLista(event: KeyboardEvent, selectorElementos: string): void {
    const target = event.target as HTMLElement;
    if (this.esCampoEditable(target)) return;

    if (['ArrowDown', 'ArrowUp', 'Space', 'Enter'].includes(event.key)) {
      const elements = Array.from(document.querySelectorAll(selectorElementos)) as HTMLElement[];
      if (elements.length === 0) return;

      const currentIndex = elements.indexOf(target);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
        elements[prevIndex].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        target.click();
      }
    }
  }

  manejarTecladoRecent(event: KeyboardEvent): void {
    this.manejarTecladoLista(event, '.recent-messages-scroll .recent-message');
  }

  manejarTecladoInbox(event: KeyboardEvent): void {
    this.manejarTecladoLista(event, '.inbox-list .inbox-item');
  }

  manejarTecladoSent(event: KeyboardEvent): void {
    this.manejarTecladoLista(event, '.sent-messages-list .sent-message-item');
  }

  manejarTecladoCalendarEvent(event: KeyboardEvent): void {
    this.manejarTecladoLista(event, '.calendar-activities-scroll .calendar-event-item[tabindex="0"]');
  }

  manejarTecladoCalendarioCompact(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.abrirCalendario();
    }
  }

  manejarTecladoUsuarioAdmin(event: KeyboardEvent, usuario: UsuarioSistema): void {
    const target = event.target as HTMLElement;
    if (this.esCampoEditable(target)) return;

    const isRow = target.tagName.toLowerCase() === 'tr';
    if (!isRow) return;

    if (['ArrowDown', 'ArrowUp', 'Space', 'Enter'].includes(event.key)) {
      const rows = Array.from(document.querySelectorAll('.admin-table tbody tr')) as HTMLElement[];
      if (rows.length === 0) return;

      const currentIndex = rows.indexOf(target);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % rows.length;
        rows[nextIndex].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + rows.length) % rows.length;
        rows[prevIndex].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.seleccionarUsuarioAdmin(usuario);
      }
    }
  }

  manejarTecladoFormatos(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      const summaries = Array.from(document.querySelectorAll('.formato-category summary')) as HTMLElement[];
      if (summaries.length === 0) return;

      const target = event.target as HTMLElement;
      const currentIndex = summaries.indexOf(target);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % summaries.length;
        summaries[nextIndex].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + summaries.length) % summaries.length;
        summaries[prevIndex].focus();
      }
    }
  }

  manejarTecladoCalendario(event: KeyboardEvent, index: number): void {
    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Space', 'Enter'].includes(event.key)) {
      const cells = Array.from(document.querySelectorAll('.calendar-grid > *')) as HTMLElement[];
      if (cells.length === 0) return;

      let nextIndex = index;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextIndex = index + 1;
        while (nextIndex < 42 && cells[nextIndex].classList.contains('calendar-day-empty')) {
          nextIndex++;
        }
        if (nextIndex >= 42) nextIndex = index;
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        nextIndex = index - 1;
        while (nextIndex >= 0 && cells[nextIndex].classList.contains('calendar-day-empty')) {
          nextIndex--;
        }
        if (nextIndex < 0) nextIndex = index;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = index + 7;
        while (nextIndex < 42 && cells[nextIndex].classList.contains('calendar-day-empty')) {
          nextIndex += 7;
        }
        if (nextIndex >= 42) nextIndex = index;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = index - 7;
        while (nextIndex >= 0 && cells[nextIndex].classList.contains('calendar-day-empty')) {
          nextIndex -= 7;
        }
        if (nextIndex < 0) nextIndex = index;
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const button = cells[index].querySelector('button') || cells[index];
        button.click();
        return;
      }

      if (nextIndex !== index && nextIndex >= 0 && nextIndex < 42) {
        const targetBtn = cells[nextIndex].querySelector('button') as HTMLElement;
        if (targetBtn) {
          targetBtn.focus();
        } else if (cells[nextIndex].tagName.toLowerCase() === 'button') {
          cells[nextIndex].focus();
        }
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  manejarEscapeModales(event: Event): void {
    if (this.mostrarCambioObligatorioModal) {
      event.preventDefault();
      return;
    }
    if (this.mensajeSeleccionado) {
      event.preventDefault();
      this.cerrarDetalles();

    } else if (this.modalEditarUsuarioAbierto) {
      event.preventDefault();
      this.cerrarModalEditarUsuario();
    } else if (this.modalVerUsuarioAbierto) {
      event.preventDefault();
      this.cerrarModalVerUsuario();
    } else if (this.mostrarPerfilModal) {
      event.preventDefault();
      this.cerrarPerfilUsuario();
    } else if (this.calendarioModalAbierto) {
      event.preventDefault();
      this.cerrarCalendario();
    }
  }

  private obtenerFechaRelativa(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return this.formatearFechaLocal(d);
  }

  manejarTecladoArchivo(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const fileInput = document.getElementById('documento') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

}
