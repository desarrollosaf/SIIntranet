import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
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


@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  constructor(private cdr: ChangeDetectorRef) {
    this.detectarSesionGuardada();
    this.detectarModuloInicial();
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

  recordatoriosCalendario: EventoCalendario[] = [];

  eventosCalendarioPrueba: EventoCalendario[] = [];

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

  usuariosSistema: UsuarioSistema[] = [
    {
      id: 1,
      nombre: 'Administrador del sistema',
      usuario: 'admin',
      correo: 'admin.intranet@congresoedomex.gob.mx',
      area: 'Dirección de Informática',
      rol: 'Administrador',
      estado: 'Activo',
      passwordTemporal: ''
    },
    {
      id: 2,
      nombre: 'Usuario de Prueba Uno',
      usuario: 'usuario1',
      correo: 'usuario1.prueba@congresoedomex.gob.mx',
      area: 'Secretaría Técnica',
      rol: 'Usuario',
      estado: 'Activo',
      passwordTemporal: ''
    },
    {
      id: 3,
      nombre: 'Usuario de Prueba Dos',
      usuario: 'usuario2',
      correo: 'usuario2.prueba@congresoedomex.gob.mx',
      area: 'Área Pendiente',
      rol: 'Usuario',
      estado: 'Inactivo',
      passwordTemporal: ''
    },
    {
      id: 4,
      nombre: 'Usuario de Prueba Tres',
      usuario: 'usuario3',
      correo: 'usuario3.prueba@congresoedomex.gob.mx',
      area: 'Dirección de Finanzas',
      rol: 'Usuario',
      estado: 'Activo',
      passwordTemporal: ''
    }
  ];

  buscarUsuarioAdmin = '';
  filtroRolAdmin = 'Todos';
  filtroEstadoAdmin = 'Todos';
  usuarioSeleccionadoAdmin: UsuarioSistema | null = null;
  usuarioEditandoAdmin: UsuarioSistema | null = null;

  totalVisitas = '--';

  enlacesExternos = [
    { nombre: 'Cámara de Diputados del Estado de México', url: 'https://congresoedomex.gob.mx/' },
    { nombre: 'Instituto de Estudios Legislativos', url: 'https://inesle.gob.mx/' },
    { nombre: 'Órgano Superior de Fiscalización', url: 'https://www.osfem.gob.mx/' },
    { nombre: 'Secretaría de Asuntos Parlamentarios', url: 'https://legislacion.congresoedomex.gob.mx/asuntosparlamentarios/secretaria' },
    { nombre: 'Contraloría del Poder Legislativo', url: 'https://contraloriadelpoderlegislativo.gob.mx/index' }
  ];

  usuariosDisponiblesBase: string[] = [
    'Administrador del sistema - Dirección de Informática',
    'Usuario de Prueba Uno - Secretaría Técnica',
    'Usuario de Prueba Dos - Área Pendiente',
    'Usuario de Prueba Tres - Dirección de Finanzas'
  ];

  usuariosDisponibles: string[] = [...this.usuariosDisponiblesBase];
  usuariosSeleccionados: string[] = [];

  selectedDisponibles: string[] = [];
  selectedSeleccionados: string[] = [];

  formTitulo = '';
  formDescripcion = '';
  formFecha = '';
  formHora = '';
  formArchivos: File[] = [];

  envioTimeouts: { [key: number]: ReturnType<typeof setTimeout> } = {};

  mensajesBandeja: Mensaje[] = [
    {
      id: 101,
      remitente: 'Usuario de Prueba Uno',
      titulo: 'Oficio de Solicitud de Mantenimiento',
      descripcion: 'Solicito apoyo para la revisión de los equipos de cómputo en el área de Secretaría Técnica.',
      fecha: '2026-06-26',
      hora: '09:00',
      documento: 'solicitud_mantenimiento.pdf',
      destinatarios: 'Administrador del sistema',
      estado: 'Nuevo',
      estadoLectura: 'Nuevo',
      estadoRespuesta: 'Pendiente',
      tipoMensaje: 'recibido'
    },
    {
      id: 102,
      remitente: 'Usuario de Prueba Tres',
      titulo: 'Reporte Presupuestal Trimestral',
      descripcion: 'Envío el reporte consolidado de gastos correspondiente al segundo trimestre para su revisión.',
      fecha: '2026-06-25',
      hora: '14:30',
      documento: 'reporte_trimestral.docx',
      destinatarios: 'Administrador del sistema',
      estado: 'Visto',
      estadoLectura: 'Visto',
      estadoRespuesta: 'Pendiente',
      tipoMensaje: 'recibido'
    },
    {
      id: 103,
      remitente: 'Usuario de Prueba Uno',
      titulo: 'Minuta de Reunión de Trabajo',
      descripcion: 'Comparto la minuta de los acuerdos tomados en la sesión del día de ayer.',
      fecha: '2026-06-24',
      hora: '11:15',
      documento: 'minuta_reunion.pdf',
      destinatarios: 'Administrador del sistema',
      estado: 'Respondido',
      estadoLectura: 'Visto',
      estadoRespuesta: 'Respondido',
      tipoMensaje: 'recibido'
    },
    {
      id: 104,
      remitente: 'Administrador del sistema',
      titulo: 'Circular de Nuevas Políticas de Seguridad',
      descripcion: 'Se solicita a todo el personal seguir los lineamientos adjuntos para el uso de contraseñas.',
      fecha: '2026-06-23',
      hora: '10:00',
      documento: 'politicas_seguridad.pdf',
      destinatarios: 'Usuario de Prueba Uno, Usuario de Prueba Tres',
      estado: 'Enviado',
      tipoMensaje: 'enviado'
    },
    {
      id: 105,
      remitente: 'Administrador del sistema',
      titulo: 'Convocatoria a Capacitación de Intranet',
      descripcion: 'Sesión de capacitación sobre el uso del nuevo sistema de gestión documental.',
      fecha: '2026-06-22',
      hora: '16:00',
      documento: 'convocatoria_capacitacion.pdf',
      destinatarios: 'Todos los usuarios',
      estado: 'Cancelado',
      tipoMensaje: 'enviado'
    }
  ];

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
      ...this.recordatoriosCalendario,
      ...this.eventosCalendarioPrueba
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
        descripcion
      }
    ];

    this.nuevoRecordatorioCalendario = '';
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

  resetearFormulario(): void {
    this.formTitulo = '';
    this.formDescripcion = '';
    this.formArchivos = [];
    this.usuariosDisponibles = [...this.usuariosDisponiblesBase];
    this.usuariosSeleccionados = [];
    this.selectedDisponibles = [];
    this.selectedSeleccionados = [];
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
      .slice(0, 5);
  }

  verDetallesMensaje(msg: Mensaje): void {
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
  }

  editarUsuarioAdmin(usuario: UsuarioSistema): void {
    this.usuarioEditandoAdmin = { ...usuario };
  }

  cancelarEdicionUsuarioAdmin(): void {
    this.usuarioEditandoAdmin = null;
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
      this.mostrarNotificacion('Usuario actualizado correctamente.', 'exito');
    }
  }

  cambiarEstadoUsuario(usuario: UsuarioSistema): void {
    usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';

    if (this.usuarioEditandoAdmin && this.usuarioEditandoAdmin.id === usuario.id) {
      this.usuarioEditandoAdmin.estado = usuario.estado;
    }

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

}