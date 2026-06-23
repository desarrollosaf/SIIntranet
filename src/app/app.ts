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

  // Base de destinatarios disponibles
  usuariosDisponiblesBase: string[] = [
    'Admin1 Admin Admin - Dir. de Informática',
    'Javier Domínguez Morales - Secretaría de Asuntos Parlamentarios',
    'José Gerardo Celestino Sánchez - Dir. de Auditoría Interna',
    'Víctor Aguilera Mier - Coordinación Administrativa',
    'Evelin Cuevas Dávila - Secretaría de Administración y Finanzas',
    'Elena Karina Castañeda Pagaza - Unidad de Información',
    'Pedro Alberto Ramírez Laguna - Dir. de Administración',
    'Diana Pérez de la Cruz - Dir. de Recursos Materiales',
    'Secretaría Técnica',
    'Walfred José Gómez Vilchis - Órgano Superior de Fiscalización'
  ];

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

  // Variables para la funcionalidad de Deshacer Envío (Undo Send)
  mostrarDeshacer = false;
  mensajeEnviandoId: number | null = null;
  deshacerTimeout: any = null;

  // Datos de bandeja de entrada
  mensajesRecibidos = [
    {
      id: 1,
      remitente: 'Secretaría Técnica',
      titulo: 'Invitación CAS 190626_1630',
      descripcion: '19 de junio de 2026 a las 16:30 horas.',
      fecha: '2026-06-19',
      hora: '16:30',
      documento: 'invitacion-cas-190626.pdf',
      estado: 'Nuevo'
    },
    {
      id: 2,
      remitente: 'Walfred José Gómez Vilchis',
      titulo: 'Contrato de Protektnet Consulting Services, S.A. de C.V.',
      descripcion: 'Contrato de 800 licencias Sophos XDR para el Órgano Superior de Fiscalización del Estado de México.',
      fecha: '2026-06-17',
      hora: '12:45',
      documento: 'contrato-protektnet.pdf',
      estado: 'Pendiente'
    },
    {
      id: 3,
      remitente: 'Secretaría Técnica',
      titulo: 'Acta CAS 150626_1700',
      descripcion: 'Ampliación al contrato CAS-LPNP02/2025/LXII-LEM, relativo a la contratación de licencias de software Microsoft Office.',
      fecha: '2026-06-15',
      hora: '10:15',
      documento: 'acta-cas-150626.pdf',
      estado: 'Visto'
    },
    {
      id: 4,
      remitente: 'Elena Karina Castañeda Pagaza',
      titulo: 'Solicitud programático-presupuestal',
      descripcion: 'Actualización al formato de solicitud programático-presupuestal derivado de cambio de titulares de departamentos.',
      fecha: '2026-06-14',
      hora: '18:20',
      documento: 'solicitud-presupuestal.docx',
      estado: 'Respondido'
    },
    {
      id: 5,
      remitente: 'Secretaría de Administración y Finanzas',
      titulo: 'Circular General 017',
      descripcion: 'Comunicado interno de la Secretaría de Administración y Finanzas para conocimiento de las áreas administrativas.',
      fecha: '2026-06-11',
      hora: '09:00',
      documento: 'circular-general-017.pdf',
      estado: 'Visto'
    }
  ];

  // Filtros de bandeja
  buscarTexto = '';
  buscarEstado = 'Todos';
  buscarFecha = '';

  // Mensaje seleccionado para el modal de detalles
  mensajeSeleccionado: any = null;

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
        // Evitar duplicados por nombre
        if (!this.formArchivos.some(f => f.name === files[i].name)) {
          this.formArchivos.push(files[i]);
        }
      }
    }
    // Resetear valor del input para que se pueda volver a seleccionar el mismo archivo
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

  // 4. Mensaje nuevo - Enviar con temporizador Deshacer y Cancelar
  enviarMensaje(event: Event): void {
    event.preventDefault();
    if (!this.formTitulo.trim()) {
      alert('Por favor ingrese un título para el documento.');
      return;
    }
    if (this.usuariosSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un destinatario.');
      return;
    }

    // Cancelar cualquier temporizador pendiente por seguridad
    if (this.deshacerTimeout) {
      clearTimeout(this.deshacerTimeout);
    }

    const nuevoId = this.mensajesRecibidos.length + 1;
    const documentosAdjuntos = this.formArchivos.length > 0
      ? this.formArchivos.map(f => f.name).join(', ')
      : 'Sin adjunto';

    const nuevoMsg = {
      id: nuevoId,
      remitente: 'Usuario Actual (Tú)',
      titulo: this.formTitulo,
      descripcion: this.formDescripcion || 'Sin descripción adicional.',
      fecha: this.formFecha,
      hora: this.formHora,
      documento: documentosAdjuntos,
      estado: 'Enviando'
    };

    // Insertar al inicio de la lista
    this.mensajesRecibidos = [nuevoMsg, ...this.mensajesRecibidos];

    this.mensajeEnviandoId = nuevoId;
    this.mostrarDeshacer = true;

    // Redirigir a inicio de inmediato para que vea el banner y el mensaje enviándose
    this.cambiarModulo('inicio');

    // Iniciar conteo de 7 segundos para consolidar el envío
    this.deshacerTimeout = setTimeout(() => {
      const msg = this.mensajesRecibidos.find(m => m.id === nuevoId);
      if (msg && msg.estado === 'Enviando') {
        msg.estado = 'Nuevo';
      }
      this.mostrarDeshacer = false;
      this.mensajeEnviandoId = null;
      this.deshacerTimeout = null;
    }, 7000);

    // Limpiar formulario de redacción
    this.formTitulo = '';
    this.formDescripcion = '';
    this.formArchivos = [];
    this.usuariosDisponibles = [...this.usuariosDisponiblesBase];
    this.usuariosSeleccionados = [];
    this.selectedDisponibles = [];
    this.selectedSeleccionados = [];
  }

  deshacerEnvio(): void {
    if (this.deshacerTimeout) {
      clearTimeout(this.deshacerTimeout);
      this.deshacerTimeout = null;
    }
    const msg = this.mensajesRecibidos.find(m => m.id === this.mensajeEnviandoId);
    if (msg) {
      msg.estado = 'Cancelado';
    }
    this.mostrarDeshacer = false;
    this.mensajeEnviandoId = null;
    alert('Envío de documento cancelado. El registro se ha guardado en el sistema con estado "Cancelado".');
  }

  cancelarFormulario(): void {
    this.formTitulo = '';
    this.formDescripcion = '';
    this.formArchivos = [];
    this.usuariosDisponibles = [...this.usuariosDisponiblesBase];
    this.usuariosSeleccionados = [];
    this.selectedDisponibles = [];
    this.selectedSeleccionados = [];
    this.actualizarFechaHora();
  }

  // 5. Bandeja de Entrada - Filtrado
  get mensajesFiltrados() {
    return this.mensajesRecibidos.filter(msg => {
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
    return this.mensajesRecibidos.filter(m => m.estado !== 'Eliminado').slice(0, 5);
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
    alert(`El documento "${msg.titulo}" ha sido movido a la Papelera.`);
  }

  // Responder redireccionando
  responderMensaje(msg: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Cambiar al módulo de nuevo mensaje
    this.moduloActual = 'mensaje';
    this.actualizarFechaHora();

    // Rellenar campos del formulario
    this.formTitulo = `RE: ${msg.titulo}`;
    this.formDescripcion = `\n\n--- Mensaje Original ---\nDe: ${msg.remitente}\nFecha: ${msg.fecha} a las ${msg.hora} horas.\nAsunto: ${msg.descripcion}`;

    // Resetear listas de destinatarios
    this.usuariosDisponibles = [...this.usuariosDisponiblesBase];
    this.usuariosSeleccionados = [];

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

}