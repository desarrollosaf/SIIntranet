import { Component } from '@angular/core';
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
  estado: 'Enviando' | 'Nuevo' | 'Pendiente' | 'Visto' | 'Respondido' | 'Cancelado' | 'Eliminado';
}

export interface EventoCalendario {
  id?: number;
  fecha: string;
  tipo: 'enviado' | 'recibido' | 'recordatorio';
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

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
    this.notificacionTimeout = setTimeout(() => {
      this.notificacion = null;
    }, 4500);
  }

  cerrarNotificacion(): void {
    this.notificacion = null;
    if (this.notificacionTimeout) clearTimeout(this.notificacionTimeout);
  }

  isLoggedIn = false;
  loginUsuario = '';
  loginPassword = '';

  mostrarPerfilModal = false;

  usuarioActual = {
    nombre: 'Usuario del sistema',
    rol: 'Usuario Activo'
  };

  totalVisitas = '--';

  enlacesExternos = [
    { nombre: 'Cámara de Diputados del Estado de México', url: 'https://congresoedomex.gob.mx/' },
    { nombre: 'Instituto de Estudios Legislativos', url: 'https://inesle.gob.mx/' },
    { nombre: 'Órgano Superior de Fiscalización', url: 'https://www.osfem.gob.mx/' },
    { nombre: 'Secretaría de Asuntos Parlamentarios', url: 'https://legislacion.congresoedomex.gob.mx/asuntosparlamentarios/secretaria' },
    { nombre: 'Contraloría del Poder Legislativo', url: 'https://contraloriadelpoderlegislativo.gob.mx/index' }
  ];

  usuariosDisponiblesBase: string[] = [];

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
        tipo: (msg.remitente === this.usuarioActual.nombre ? 'enviado' : 'recibido') as 'enviado' | 'recibido' | 'recordatorio',
        titulo: msg.titulo || 'Documento',
        descripcion: `${msg.estado || 'Estado pendiente'} · ${msg.documento || 'Documento pendiente'}`
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
    this.moduloActual = modulo;
    if (modulo === 'mensaje') {
      this.actualizarFechaHora();
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

    const nuevoMsg = {
      id: nuevoId,
      remitente: this.usuarioActual.nombre,
      titulo: this.formTitulo,
      descripcion: this.formDescripcion || 'Sin descripción adicional.',
      fecha: this.formFecha,
      hora: this.formHora,
      documento: documentosAdjuntos,
      destinatarios: this.usuariosSeleccionados.join(', '),
      estado: 'Enviando' as Mensaje['estado']
    };

    this.mensajesBandeja = [nuevoMsg, ...this.mensajesBandeja];

    this.envioTimeouts[nuevoId] = setTimeout(() => {
      const msg = this.mensajesBandeja.find(m => m.id === nuevoId);
      if (msg && msg.estado === 'Enviando') {
        msg.estado = 'Nuevo';
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

  get mensajesEnviados() {
    return this.mensajesBandeja.filter(m => m.remitente === this.usuarioActual.nombre);
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

  get mensajesFiltrados() {
    return this.mensajesBandeja.filter(msg => {
      const matchesText = !this.buscarTexto ||
        msg.remitente.toLowerCase().includes(this.buscarTexto.toLowerCase()) ||
        msg.titulo.toLowerCase().includes(this.buscarTexto.toLowerCase()) ||
        msg.descripcion.toLowerCase().includes(this.buscarTexto.toLowerCase());

      const matchesEstado = this.buscarEstado === 'Todos' || msg.estado === this.buscarEstado;

      const matchesFecha = !this.buscarFecha || msg.fecha === this.buscarFecha;

      const isDeleted = msg.estado === 'Eliminado';
      if (this.buscarEstado !== 'Eliminado' && isDeleted) {
        return false;
      }

      return matchesText && matchesEstado && matchesFecha;
    });
  }

  get mensajesRecientes(): Mensaje[] {
    return this.mensajesBandeja.filter(m => m.estado !== 'Eliminado').slice(0, 5);
  }

  verDetallesMensaje(msg: Mensaje): void {
    this.mensajeSeleccionado = msg;
    this.marcarComoVisto(msg);
  }

  cerrarDetalles(): void {
    this.mensajeSeleccionado = null;
  }

  marcarComoVisto(msg: Mensaje): void {
    if (msg.estado === 'Nuevo') {
      msg.estado = 'Visto';
    }
  }

  eliminarMensaje(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    msg.estado = 'Eliminado';
    if (this.mensajeSeleccionado && this.mensajeSeleccionado.id === msg.id) {
      this.mensajeSeleccionado = null;
    }
    this.mostrarNotificacion(`El documento "${msg.titulo}" ha sido movido a la Papelera.`, 'info');
  }

  responderMensaje(msg: Mensaje, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

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

    if (msg.estado !== 'Eliminado' && msg.estado !== 'Cancelado') {
      msg.estado = 'Respondido';
    }
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
    this.usuarioActual.nombre = this.loginUsuario.trim();
    this.usuarioActual.rol = 'Usuario Activo';
  }

  cerrarSesion(): void {
    this.isLoggedIn = false;
    this.mostrarPerfilModal = false;
    this.loginUsuario = '';
    this.loginPassword = '';
    this.resetearFormulario();
  }

  verPerfilUsuario(): void {
    this.mostrarPerfilModal = true;
  }

  cerrarPerfilUsuario(): void {
    this.mostrarPerfilModal = false;
  }

}