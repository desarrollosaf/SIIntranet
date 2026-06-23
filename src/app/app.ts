import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  moduloActual = 'inicio';

  // Contador autoincrementable para IDs únicos (no depende del tamaño del array)
  private nextId = 1;

  // Sistema de notificaciones en pantalla (reemplaza alert() nativo)
  notificacion: { mensaje: string; tipo: 'error' | 'exito' | 'info' } | null = null;
  private notificacionTimeout: any = null;

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

  // Estado de sesión y login
  isLoggedIn = false;
  loginUsuario = '';
  loginPassword = '';

  // Estado del modal de perfil de usuario
  mostrarPerfilModal = false;

  // Configuración del usuario activo
  usuarioActual = {
    nombre: 'Usuario del sistema',
    rol: 'Usuario Activo'
  };

  // Contador de visitas (pendiente de backend)
  totalVisitas = 'Total de visitas pendiente';

  // Enlaces institucionales
  enlacesExternos = [
    { nombre: 'Cámara de Diputados del Estado de México', url: '#' },
    { nombre: 'Instituto de Estudios Legislativos', url: '#' },
    { nombre: 'Órgano Superior de Fiscalización', url: '#' },
    { nombre: 'Secretaría de Asuntos Parlamentarios', url: '#' },
    { nombre: 'Contraloría del Poder Legislativo', url: '#' }
  ];

  // Base de destinatarios disponibles (inicialmente vacía para conexión posterior a API)
  usuariosDisponiblesBase: string[] = [];

  usuariosDisponibles: string[] = [...this.usuariosDisponiblesBase];
  usuariosSeleccionados: string[] = [];

  selectedDisponibles: string[] = [];
  selectedSeleccionados: string[] = [];

  // Datos de formulario
  formTitulo = '';
  formDescripcion = '';
  formFecha = '';
  formHora = '';
  formArchivos: File[] = [];

  // Temporizadores activos por id de mensaje
  envioTimeouts: { [key: number]: any } = {};

  // Datos de bandeja de entrada (inicialmente vacía para conexión posterior a base de datos)
  mensajesBandeja: any[] = [];

  // Filtros de bandeja
  buscarTexto = '';
  buscarEstado = 'Todos';
  buscarFecha = '';

  // Mensaje seleccionado para el modal de detalles
  mensajeSeleccionado: any = null;

  // Categorías de formatos institucionales
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

  // 1. Mensaje nuevo - fecha y hora automáticas
  actualizarFechaHora(): void {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    this.formFecha = `${año}-${mes}-${dia}`;

    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    this.formHora = `${horas}:${minutos}`;
  }

  // 2. Mensaje nuevo - Selector de archivos múltiples y cancelación por índice
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (!this.formArchivos.some(f => f.name === files[i].name)) {
          this.formArchivos.push(files[i]);
        }
      }
    }
    event.target.value = '';
  }

  clearSelectedFile(index: number): void {
    this.formArchivos.splice(index, 1);
  }

  // 3. Mensaje nuevo - Destinatarios
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

  // 4. Mensaje nuevo - Enviar con temporizador individual en el historial de abajo
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
      estado: 'Enviando'
    };

    // Insertar al inicio de la lista
    this.mensajesBandeja = [nuevoMsg, ...this.mensajesBandeja];

    // Iniciar conteo de 7 segundos para consolidar el envío de este mensaje específico
    this.envioTimeouts[nuevoId] = setTimeout(() => {
      const msg = this.mensajesBandeja.find(m => m.id === nuevoId);
      if (msg && msg.estado === 'Enviando') {
        msg.estado = 'Nuevo';
      }
      delete this.envioTimeouts[nuevoId];
    }, 7000);

    // Limpiar formulario de redacción
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

  // 5. Bandeja de Entrada - Filtrado
  get mensajesFiltrados() {
    return this.mensajesBandeja.filter(msg => {
      // Filtrar por texto
      const matchesText = !this.buscarTexto || 
        msg.remitente.toLowerCase().includes(this.buscarTexto.toLowerCase()) ||
        msg.titulo.toLowerCase().includes(this.buscarTexto.toLowerCase()) ||
        msg.descripcion.toLowerCase().includes(this.buscarTexto.toLowerCase());
      
      // Filtrar por estado
      const matchesEstado = this.buscarEstado === 'Todos' || msg.estado === this.buscarEstado;

      // Filtrar por fecha
      const matchesFecha = !this.buscarFecha || msg.fecha === this.buscarFecha;

      // Omitir eliminados a menos que se filtre específicamente por "Eliminado"
      const isDeleted = msg.estado === 'Eliminado';
      if (this.buscarEstado !== 'Eliminado' && isDeleted) {
        return false;
      }

      return matchesText && matchesEstado && matchesFecha;
    });
  }

  // 6. Mensajes Recientes en Inicio (excluyendo eliminados)
  get mensajesRecientes() {
    return this.mensajesBandeja.filter(m => m.estado !== 'Eliminado').slice(0, 5);
  }

  // 7. Bandeja de Entrada & Inicio - Detalle de mensaje y marcar visto
  verDetallesMensaje(msg: any): void {
    this.mensajeSeleccionado = msg;
    this.marcarComoVisto(msg);
  }

  cerrarDetalles(): void {
    this.mensajeSeleccionado = null;
  }

  marcarComoVisto(msg: any): void {
    if (msg.estado === 'Nuevo') {
      msg.estado = 'Visto';
    }
  }

  // Papelera / Eliminar en lugar de archivar
  eliminarMensaje(msg: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    msg.estado = 'Eliminado';
    if (this.mensajeSeleccionado && this.mensajeSeleccionado.id === msg.id) {
      this.mensajeSeleccionado = null;
    }
    this.mostrarNotificacion(`El documento "${msg.titulo}" ha sido movido a la Papelera.`, 'info');
  }

  // Responder redireccionando
  responderMensaje(msg: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Cambiar al módulo de nuevo mensaje
    this.moduloActual = 'mensaje';
    this.actualizarFechaHora();

    // Limpiar formulario antes de rellenar el destinatario
    this.resetearFormulario();

    // Buscar coincidencia para el remitente en destinatarios
    const remitenteLower = msg.remitente.toLowerCase();
    const match = this.usuariosDisponibles.find(u => u.toLowerCase().includes(remitenteLower));

    if (match) {
      this.usuariosDisponibles = this.usuariosDisponibles.filter(u => u !== match);
      this.usuariosSeleccionados = [match];
    } else {
      const nuevoDestinatario = `${msg.remitente} - Remitente original`;
      this.usuariosSeleccionados = [nuevoDestinatario];
    }

    // Cambiar estado a respondido en el frontend
    if (msg.estado !== 'Eliminado' && msg.estado !== 'Cancelado') {
      msg.estado = 'Respondido';
    }
  }

  // Métodos de autenticación y perfil (Frontend)
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

    // Login exitoso (mock frontend)
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