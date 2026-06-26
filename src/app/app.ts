import { Component, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
}

export interface DocumentoFormato {
  nombre: string;
  archivo: string;
}


@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {

  documentosFormatos: { [categoria: string]: DocumentoFormato[] } = {};

  constructor(private cdr: ChangeDetectorRef) {
    this.detectarSesionGuardada();
    this.detectarModuloInicial();
    this.inicializarDatosPrueba();
    this.inicializarVisitas();
    this.actualizarUsuariosDisponibles();
  }

  ngOnDestroy(): void {
    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
    }
    for (const key in this.envioTimeouts) {
      if (Object.prototype.hasOwnProperty.call(this.envioTimeouts, key)) {
        clearTimeout(this.envioTimeouts[key]);
      }
    }
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
        this.isLoggedIn = true;
      } catch (e) {
        this.isLoggedIn = false;
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
      }
    } else {
      this.moduloActual = 'inicio';
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
    this.cdr.detectChanges();
  }

  moduloActual = 'inicio';

  private nextId = 1;

  private nextRecordatorioId = 1;

  diasSemanaCalendario = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  mesCalendario = new Date().getMonth();
  anioCalendario = new Date().getFullYear();

  fechaSeleccionadaCalendario = this.formatearFechaLocal(new Date());
  nuevoRecordatorioCalendario = '';
  nuevoRecordatorioHoraCalendario = '';
  calendarioModalAbierto = false;
  fechaBusquedaCalendario = '';
  filtroEventosCalendario: 'Todos' | 'Recibidos' | 'Enviados' | 'Recordatorios' = 'Todos';
  buscarDestinatario = '';

  recordatoriosCalendario: EventoCalendario[] = [];

  notificacion: { mensaje: string; tipo: 'error' | 'exito' | 'info' } | null = null;
  private notificacionTimeout: ReturnType<typeof setTimeout> | null = null;

  mostrarNotificacion(mensaje: string, tipo: 'error' | 'exito' | 'info' = 'info'): void {
    if (this.notificacionTimeout) clearTimeout(this.notificacionTimeout);
    this.notificacion = { mensaje, tipo };
    this.cdr.detectChanges();
    this.notificacionTimeout = setTimeout(() => {
      this.notificacion = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  isLoggedIn = false;
  loginUsuario = '';
  loginPassword = '';

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
    { nombre: 'Instituto de Estudios Legislativos', url: 'https://inesle.gob.mx/' },
    { nombre: 'Órgano Superior de Fiscalización', url: 'https://www.osfem.gob.mx/' },
    { nombre: 'Secretaría de Asuntos Parlamentarios', url: 'https://legislacion.congresoedomex.gob.mx/asuntosparlamentarios/secretaria' },
    { nombre: 'Contraloría del Poder Legislativo', url: 'https://contraloriadelpoderlegislativo.gob.mx/index' }
  ];

  usuariosDisponibles: string[] = [];
  usuariosSeleccionados: string[] = [];

  selectedDisponibles: string[] = [];
  selectedSeleccionados: string[] = [];

  formTitulo = '';
  formDescripcion = '';
  formFecha = '';
  formHora = '';
  formArchivos: File[] = [];

  envioTimeouts: { [key: number]: ReturnType<typeof setTimeout> } = {};

  mensajesBandeja: Mensaje[] = [];

  buscarTexto = '';
  buscarEstado = 'Todos';
  buscarFecha = '';

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
      .filter(msg => msg.fecha && msg.estado !== 'Eliminado')
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

    // Rellenar hasta completar exactamente 42 celdas (6 semanas x 7 días)
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

    const descripcion = this.nuevoRecordatorioCalendario.trim();

    if (!descripcion) {
      this.mostrarNotificacion('Ingrese una descripción para el recordatorio.', 'error');
      return;
    }

    this.recordatoriosCalendario = [
      ...this.recordatoriosCalendario,
      {
        id: this.nextRecordatorioId++,
        fecha: this.fechaSeleccionadaCalendario,
        tipo: 'recordatorio',
        titulo: 'Recordatorio',
        descripcion,
        hora: this.nuevoRecordatorioHoraCalendario || undefined
      }
    ];

    this.nuevoRecordatorioCalendario = '';
    this.nuevoRecordatorioHoraCalendario = '';
    this.mostrarNotificacion('Recordatorio agregado correctamente.', 'exito');
  }

  eliminarRecordatorioCalendario(id: number | undefined, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (id === undefined) return;
    this.recordatoriosCalendario = this.recordatoriosCalendario.filter(recordatorio => recordatorio.id !== id);
    this.mostrarNotificacion('Recordatorio eliminado.', 'info');
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

  get descripcionModulo(): string {
    switch (this.moduloActual) {
      case 'mensaje':
        return 'Registro y envío de documentos internos';
      case 'bandeja':
        return 'Consulta de mensajes y documentos recibidos';
      case 'formatos':
        return 'Consulta de formatos y manuales institucionales';
      case 'administracion':
        return 'Gestión administrativa del sistema';
      default:
        return 'Sistema interno de gestión documental';
    }
  }

  actualizarFechaHora(): void {
    const actual = new Date();
    const año = actual.getFullYear();
    const mes = String(actual.getMonth() + 1).padStart(2, '0');
    const dia = String(actual.getDate()).padStart(2, '0');
    this.formFecha = `${año}-${mes}-${dia}`;

    const horas = String(actual.getHours()).padStart(2, '0');
    const minutos = String(actual.getMinutes()).padStart(2, '0');
    this.formHora = `${horas}:${minutos}`;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (!this.formArchivos.some(f => f.name === files[i].name)) {
          this.formArchivos.push(files[i]);
        }
      }
    }
    target.value = '';
  }

  clearSelectedFile(index: number): void {
    this.formArchivos.splice(index, 1);
  }

  pasar(): void {
    if (this.selectedDisponibles.length === 0) return;
    this.usuariosSeleccionados = [...this.usuariosSeleccionados, ...this.selectedDisponibles];
    this.usuariosDisponibles = this.usuariosDisponibles.filter(u => !this.selectedDisponibles.includes(u));
    this.selectedDisponibles = [];
  }

  quitar(): void {
    if (this.selectedSeleccionados.length === 0) return;
    this.usuariosDisponibles = [...this.usuariosDisponibles, ...this.selectedSeleccionados];
    this.usuariosSeleccionados = this.usuariosSeleccionados.filter(u => !this.selectedSeleccionados.includes(u));
    this.selectedSeleccionados = [];
  }

  pasarTodos(): void {
    this.usuariosSeleccionados = [...this.usuariosSeleccionados, ...this.usuariosDisponibles];
    this.usuariosDisponibles = [];
    this.selectedDisponibles = [];
  }

  quitarTodos(): void {
    this.usuariosDisponibles = [...this.usuariosDisponibles, ...this.usuariosSeleccionados];
    this.usuariosSeleccionados = [];
    this.selectedSeleccionados = [];
  }

  enviarMensaje(event: Event): void {
    event.preventDefault();
    if (!this.formTitulo.trim()) {
      this.mostrarNotificacion('Por favor ingrese un título para el documento.', 'error');
      return;
    }
    if (this.usuariosSeleccionados.length === 0) {
      this.mostrarNotificacion('Por favor seleccione al menos un destinatario.', 'error');
      return;
    }

    const nuevoId = this.nextId++;
    const documentosAdjuntos = this.formArchivos.length > 0
      ? this.formArchivos.map(f => f.name).join(', ')
      : 'Sin adjunto';

    const nuevoMsg: Mensaje = {
      id: nuevoId,
      remitente: this.usuarioActual.nombre,
      titulo: this.formTitulo,
      descripcion: this.formDescripcion || 'Sin descripción adicional.',
      fecha: this.formFecha,
      hora: this.formHora,
      documento: documentosAdjuntos,
      destinatarios: this.usuariosSeleccionados.join(', '),
      estado: 'Enviando',
      tipoMensaje: 'enviado'
    };

    this.mensajesBandeja = [nuevoMsg, ...this.mensajesBandeja];
    this.mostrarNotificacion('Enviando documento...', 'info');

    this.envioTimeouts[nuevoId] = setTimeout(() => {
      const msg = this.mensajesBandeja.find(m => m.id === nuevoId);
      if (msg && msg.estado === 'Enviando') {
        msg.estado = 'Enviado';
        this.mostrarNotificacion('Mensaje enviado correctamente.', 'exito');
        this.cdr.detectChanges();
      }
      delete this.envioTimeouts[nuevoId];
    }, 7000);

    this.resetearFormulario();
    this.actualizarFechaHora();
  }

  cancelarEnvio(id: number): void {
    if (this.envioTimeouts[id]) {
      clearTimeout(this.envioTimeouts[id]);
      delete this.envioTimeouts[id];
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

  get usuariosDisponiblesFiltrados(): string[] {
    if (!this.buscarDestinatario.trim()) {
      return this.usuariosDisponibles;
    }
    const query = this.buscarDestinatario.toLowerCase().trim();
    return this.usuariosDisponibles.filter(u => u.toLowerCase().includes(query));
  }

  resetearFormulario(): void {
    this.formTitulo = '';
    this.formDescripcion = '';
    this.formArchivos = [];
    this.usuariosSeleccionados = [];
    this.selectedDisponibles = [];
    this.selectedSeleccionados = [];
    this.buscarDestinatario = '';
    this.actualizarUsuariosDisponibles();
  }

  cancelarFormulario(): void {
    this.resetearFormulario();
    this.actualizarFechaHora();
  }

  get mensajesFiltrados(): Mensaje[] {
    return this.mensajesBandeja.filter(msg => {
      const matchesText = !this.buscarTexto ||
        msg.remitente.toLowerCase().includes(this.buscarTexto.toLowerCase()) ||
        msg.titulo.toLowerCase().includes(this.buscarTexto.toLowerCase()) ||
        msg.descripcion.toLowerCase().includes(this.buscarTexto.toLowerCase());

      let matchesEstado = false;
      const esEnviado = this.esMensajeEnviado(msg);
      const esRecibido = this.esMensajeRecibido(msg);

      if (this.buscarEstado === 'Todos') {
        matchesEstado = msg.estado !== 'Eliminado';
      } else if (this.buscarEstado === 'Nuevo') {
        matchesEstado = esRecibido && msg.estadoLectura === 'Nuevo' && msg.estado !== 'Eliminado';
      } else if (this.buscarEstado === 'Visto') {
        matchesEstado = esRecibido && msg.estadoLectura === 'Visto' && msg.estado !== 'Eliminado';
      } else if (this.buscarEstado === 'Respondido') {
        matchesEstado = esRecibido && msg.estadoRespuesta === 'Respondido' && msg.estado !== 'Eliminado';
      } else if (this.buscarEstado === 'Enviado') {
        matchesEstado = esEnviado && msg.estado === 'Enviado';
      } else if (this.buscarEstado === 'Cancelado') {
        matchesEstado = esEnviado && msg.estado === 'Cancelado';
      } else if (this.buscarEstado === 'Eliminado') {
        matchesEstado = msg.estado === 'Eliminado';
      }

      const matchesFecha = !this.buscarFecha || msg.fecha === this.buscarFecha;

      return matchesText && matchesEstado && matchesFecha;
    });
  }

  get mensajesRecientes(): Mensaje[] {
    return [...this.mensajesBandeja]
      .filter(m => m.estado !== 'Eliminado')
      .sort((a, b) => {
        const datetimeA = `${a.fecha}T${a.hora}`;
        const datetimeB = `${b.fecha}T${b.hora}`;
        return datetimeB.localeCompare(datetimeA);
      })
      .slice(0, 10);
  }

  verDetallesMensaje(msg: Mensaje): void {
    this.cerrarCalendario();
    this.mensajeSeleccionado = msg;
    this.marcarComoVisto(msg);
  }

  cerrarDetalles(): void {
    this.mensajeSeleccionado = null;
  }

  marcarComoVisto(msg: Mensaje): void {
    if (this.esMensajeRecibido(msg)) {
      if (msg.estadoLectura !== 'Visto') {
        msg.estadoLectura = 'Visto';
        if (msg.estado === 'Nuevo') {
          msg.estado = 'Visto';
        }
        this.mostrarNotificacion(`Documento "${msg.titulo}" marcado como visto.`, 'info');
        this.cdr.detectChanges();
      }
    }
  }

  eliminarMensaje(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    msg.estadoTemporal = 'Eliminando';
    this.mostrarNotificacion('Eliminando documento...', 'info');
    this.cdr.detectChanges();

    setTimeout(() => {
      msg.estadoTemporal = null;
      msg.estado = 'Eliminado';
      if (this.mensajeSeleccionado && this.mensajeSeleccionado.id === msg.id) {
        this.mensajeSeleccionado = null;
      }
      this.mostrarNotificacion(`El documento "${msg.titulo}" ha sido movido a la Papelera.`, 'exito');
      this.cdr.detectChanges();
    }, 1500);
  }

  responderMensaje(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    msg.estadoTemporal = 'Respondiendo';
    this.mostrarNotificacion('Preparando respuesta...', 'info');
    this.cdr.detectChanges();

    setTimeout(() => {
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
    }, 1500);
  }

  hacerLogin(event: Event): void {
    event.preventDefault();
    if (!this.loginUsuario.trim()) {
      this.mostrarNotificacion('Por favor ingrese su usuario o correo.', 'error');
      return;
    }
    if (!this.loginPassword.trim()) {
      this.mostrarNotificacion('Por favor ingrese su contraseña.', 'error');
      return;
    }

    this.isLoggedIn = true;
    const usuarioLimpio = this.loginUsuario.trim().toLowerCase();
    if (usuarioLimpio === 'admin') {
      this.usuarioActual = {
        nombre: 'Administrador del sistema',
        rol: 'Administrador',
        tipo: 'admin'
      };
      this.mostrarNotificacion('Sesión iniciada como Administrador.', 'exito');
    } else {
      this.usuarioActual = {
        nombre: this.loginUsuario.trim(),
        rol: 'Usuario',
        tipo: 'normal'
      };
      this.mostrarNotificacion('Sesión iniciada correctamente.', 'exito');
    }

    sessionStorage.setItem('si_session_logged', 'true');
    sessionStorage.setItem('si_session_user', JSON.stringify(this.usuarioActual));

    window.location.hash = this.moduloActual;
    window.history.replaceState({ modulo: this.moduloActual }, '', '#' + this.moduloActual);
  }

  cerrarSesion(): void {
    this.isLoggedIn = false;
    this.mostrarPerfilModal = false;
    this.loginUsuario = '';
    this.loginPassword = '';
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

  verPerfilUsuario(): void {
    this.mostrarPerfilModal = true;
  }

  cerrarPerfilUsuario(): void {
    this.mostrarPerfilModal = false;
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
    this.usuarioSeleccionadoAdmin = usuario;
    this.usuarioEditandoAdmin = null;
    this.modalVerUsuarioAbierto = true;
  }

  cerrarModalVerUsuario(): void {
    this.modalVerUsuarioAbierto = false;
    this.usuarioSeleccionadoAdmin = null;
  }

  abrirModalEditarUsuario(usuario: UsuarioSistema): void {
    this.usuarioEditandoAdmin = { ...usuario };
    this.modalEditarUsuarioAbierto = true;
    this.modalVerUsuarioAbierto = false;
  }

  cerrarModalEditarUsuario(): void {
    this.modalEditarUsuarioAbierto = false;
    this.usuarioEditandoAdmin = null;
  }

  cancelarEdicionUsuarioAdmin(): void {
    this.usuarioEditandoAdmin = null;
    this.modalEditarUsuarioAbierto = false;
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
    if (!this.usuarioEditandoAdmin.rol.trim()) {
      this.mostrarNotificacion('El rol no puede estar vacío.', 'error');
      return;
    }
    if (this.usuarioEditandoAdmin.estado !== 'Activo' && this.usuarioEditandoAdmin.estado !== 'Inactivo') {
      this.mostrarNotificacion('El estado seleccionado no es válido.', 'error');
      return;
    }

    const index = this.usuariosSistema.findIndex(u => u.id === this.usuarioEditandoAdmin!.id);
    if (index !== -1) {
      this.usuariosSistema[index] = { ...this.usuarioEditandoAdmin };
      this.usuarioSeleccionadoAdmin = this.usuariosSistema[index];
      this.usuarioEditandoAdmin = null;
      this.modalEditarUsuarioAbierto = false;
      this.actualizarUsuariosDisponibles();
      this.mostrarNotificacion('Usuario actualizado correctamente.', 'exito');
    }
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

  obtenerTextoOrigenMensaje(msg: Mensaje): string {
    return this.esMensajeEnviado(msg) ? 'Enviado por ti' : msg.remitente;
  }

  obtenerTextoDestinoMensaje(msg: Mensaje): string {
    return this.esMensajeEnviado(msg) ? msg.destinatarios : 'Para mí';
  }

  obtenerResumenParticipantesMensaje(msg: Mensaje): string {
    return this.esMensajeEnviado(msg) ? `Para: ${msg.destinatarios}` : msg.remitente;
  }

  obtenerEtiquetaTipoMensaje(msg: Mensaje): string {
    return this.esMensajeEnviado(msg) ? 'Enviado' : 'Recibido';
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
      msg.estadoLectura = 'Visto';
      msg.estadoRespuesta = 'Respondido';
      msg.estado = 'Respondido';
      this.cdr.detectChanges();
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
      setTimeout(() => {
        msg.estadoTemporal = null;
        msg.estado = 'Cancelado';
        this.mostrarNotificacion('Envío cancelado correctamente.', 'exito');
        this.cdr.detectChanges();
      }, 1500);
    }
  }

  abrirCalendario(): void {
    this.calendarioModalAbierto = true;
    this.filtroEventosCalendario = 'Todos';
    this.fechaBusquedaCalendario = this.fechaSeleccionadaCalendario;
    this.cdr.detectChanges();
  }

  cerrarCalendario(): void {
    this.calendarioModalAbierto = false;
    this.cdr.detectChanges();
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
      if (this.filtroEventosCalendario === 'Recibidos') return ev.tipo === 'recibido';
      if (this.filtroEventosCalendario === 'Enviados') return ev.tipo === 'enviado';
      if (this.filtroEventosCalendario === 'Recordatorios') return ev.tipo === 'recordatorio';
      return true;
    });

    return [...filtrados].sort((a, b) => {
      const timeA = a.hora || '00:00';
      const timeB = b.hora || '00:00';
      const datetimeA = `${a.fecha}T${timeA}`;
      const datetimeB = `${b.fecha}T${timeB}`;
      return datetimeB.localeCompare(datetimeA);
    });
  }

  inicializarDatosPrueba(): void {
    const areas = [
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

    const usersList: UsuarioSistema[] = [];

    // 10 Admin users (1 to 10)
    for (let i = 1; i <= 10; i++) {
      const area = areas[(i - 1) % areas.length];
      usersList.push({
        id: i,
        nombre: `Administrador de Prueba ${String(i).padStart(2, '0')}`,
        usuario: `admin${i}`,
        correo: `admin${i}.prueba@siintranet.local`,
        area: area,
        rol: 'Administrador',
        estado: i % 3 === 0 ? 'Inactivo' : 'Activo',
        passwordTemporal: ''
      });
    }

    // 10 Normal users (11 to 20)
    for (let i = 1; i <= 10; i++) {
      const id = i + 10;
      const area = areas[(i - 1) % areas.length];
      usersList.push({
        id: id,
        nombre: `Usuario de Prueba ${String(i).padStart(2, '0')}`,
        usuario: `usuario${i}`,
        correo: `usuario${i}.prueba@siintranet.local`,
        area: area,
        rol: 'Usuario',
        estado: i % 4 === 0 ? 'Inactivo' : 'Activo',
        passwordTemporal: ''
      });
    }

    this.usuariosSistema = usersList;

    // Generate Messages (60 total)
    const msgsList: Mensaje[] = [];
    let msgId = 101;

    // A. 10 Received - Nuevo (unread)
    for (let i = 1; i <= 10; i++) {
      msgsList.push({
        id: msgId++,
        remitente: `Usuario de Prueba ${String((i % 10) + 1).padStart(2, '0')}`,
        titulo: `Oficio Recibido Nuevo ${String(i).padStart(2, '0')}`,
        descripcion: `Descripción del oficio recibido nuevo número ${i} de prueba para validación de bandeja.`,
        fecha: this.obtenerFechaRelativa(-i),
        hora: `09:${String(10 + i).padStart(2, '0')}`,
        documento: `oficio_recibido_nuevo_${i}.pdf`,
        destinatarios: 'Administrador del sistema',
        estado: 'Nuevo',
        tipoMensaje: 'recibido',
        estadoLectura: 'Nuevo',
        estadoRespuesta: 'Pendiente'
      });
    }

    // B. 10 Received - Visto (read)
    for (let i = 1; i <= 10; i++) {
      msgsList.push({
        id: msgId++,
        remitente: `Usuario de Prueba ${String(((i + 2) % 10) + 1).padStart(2, '0')}`,
        titulo: `Circular Recibida Vista ${String(i).padStart(2, '0')}`,
        descripcion: `Descripción detallada de la circular leída/vista número ${i} de prueba para bandeja de entrada.`,
        fecha: this.obtenerFechaRelativa(-(i + 2)),
        hora: `10:${String(15 + i).padStart(2, '0')}`,
        documento: `circular_vista_${i}.pdf`,
        destinatarios: 'Administrador del sistema',
        estado: 'Visto',
        tipoMensaje: 'recibido',
        estadoLectura: 'Visto',
        estadoRespuesta: 'Pendiente'
      });
    }

    // C. 10 Received - Respondido (read + replied)
    for (let i = 1; i <= 10; i++) {
      msgsList.push({
        id: msgId++,
        remitente: `Usuario de Prueba ${String(((i + 5) % 10) + 1).padStart(2, '0')}`,
        titulo: `Solicitud Respondida ${String(i).padStart(2, '0')}`,
        descripcion: `Detalle de la solicitud que ya ha sido contestada y marcada como respondida número ${i}.`,
        fecha: this.obtenerFechaRelativa(-(i + 5)),
        hora: `11:${String(20 + i).padStart(2, '0')}`,
        documento: `solicitud_respondida_${i}.docx`,
        destinatarios: 'Administrador del sistema',
        estado: 'Respondido',
        tipoMensaje: 'recibido',
        estadoLectura: 'Visto',
        estadoRespuesta: 'Respondido'
      });
    }

    // D. 10 Sent - Enviado (sent)
    for (let i = 1; i <= 10; i++) {
      msgsList.push({
        id: msgId++,
        remitente: 'Administrador del sistema',
        titulo: `Oficio Enviado Institucional ${String(i).padStart(2, '0')}`,
        descripcion: `Copia de comunicación oficial interna enviada a departamentos número ${i} de prueba.`,
        fecha: this.obtenerFechaRelativa(-i),
        hora: `14:${String(10 + i).padStart(2, '0')}`,
        documento: `oficio_enviado_${i}.pdf`,
        destinatarios: `Usuario de Prueba ${String(i).padStart(2, '0')}`,
        estado: 'Enviado',
        tipoMensaje: 'enviado'
      });
    }

    // E. 10 Sent - Cancelado (cancelled)
    for (let i = 1; i <= 10; i++) {
      msgsList.push({
        id: msgId++,
        remitente: 'Administrador del sistema',
        titulo: `Envío cancelado de oficio interno ${String(i).padStart(2, '0')}`,
        descripcion: `Transmisión anulada o cancelada número ${i} por reestructuración del contenido interno.`,
        fecha: this.obtenerFechaRelativa(-i),
        hora: `15:${String(30 + i).padStart(2, '0')}`,
        documento: `circular_anulada_${i}.pdf`,
        destinatarios: `Usuario de Prueba ${String((i % 10) + 1).padStart(2, '0')}`,
        estado: 'Cancelado',
        tipoMensaje: 'enviado'
      });
    }

    // F. 10 Deleted - Eliminado (appearing only in trash filter)
    for (let i = 1; i <= 10; i++) {
      msgsList.push({
        id: msgId++,
        remitente: i % 2 === 0 ? 'Administrador del sistema' : `Usuario de Prueba ${String(i).padStart(2, '0')}`,
        titulo: `Documento Eliminado de Prueba ${String(i).padStart(2, '0')}`,
        descripcion: `Mensaje borrado número ${i} que únicamente debe ser visible bajo el filtro de Papelera.`,
        fecha: this.obtenerFechaRelativa(-15),
        hora: `16:00`,
        documento: `borrador_descartado_${i}.pdf`,
        destinatarios: i % 2 === 0 ? `Usuario de Prueba ${String(i).padStart(2, '0')}` : 'Administrador del sistema',
        estado: 'Eliminado',
        tipoMensaje: i % 2 === 0 ? 'enviado' : 'recibido',
        estadoLectura: 'Visto'
      });
    }

    this.mensajesBandeja = msgsList;

    // Generate 10+ Recordatorios (12 total: 4 today, 8 on other days)
    const recordatorios: EventoCalendario[] = [];
    const hoyStr = this.formatearFechaLocal(new Date());

    for (let i = 1; i <= 4; i++) {
      recordatorios.push({
        id: i,
        fecha: hoyStr,
        tipo: 'recordatorio',
        titulo: `Recordatorio de Hoy ${String(i).padStart(2, '0')}`,
        descripcion: `Revisión interna y firma de minutas de hoy, pendiente número ${i}.`,
        hora: `10:${String(i * 10).padStart(2, '0')}`
      });
    }

    for (let i = 5; i <= 12; i++) {
      const diasDesfase = i % 2 === 0 ? (i * 2) : -(i * 2);
      recordatorios.push({
        id: i,
        fecha: this.obtenerFechaRelativa(diasDesfase),
        tipo: 'recordatorio',
        titulo: `Recordatorio Programado ${String(i).padStart(2, '0')}`,
        descripcion: `Actividad calendarizada para seguimiento del sistema de prueba número ${i}.`,
        hora: `11:00`
      });
    }

    this.recordatoriosCalendario = recordatorios;
    this.nextRecordatorioId = 13;

    // Reorganize formats documents to populate dynamically
    this.categoriasFormatos.forEach((cat, index) => {
      this.documentosFormatos[cat] = [
        { nombre: `Formato de prueba ${String(index + 1).padStart(2, '0')}A.pdf`, archivo: `formato_prueba_${index + 1}a.pdf` },
        { nombre: `Solicitud interna de prueba ${String(index + 1).padStart(2, '0')}B.pdf`, archivo: `solicitud_prueba_${index + 1}b.pdf` },
        { nombre: `Oficio administrativo de prueba ${String(index + 1).padStart(2, '0')}C.pdf`, archivo: `oficio_prueba_${index + 1}c.pdf` }
      ];
    });
  }

  private obtenerFechaRelativa(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return this.formatearFechaLocal(d);
  }

}