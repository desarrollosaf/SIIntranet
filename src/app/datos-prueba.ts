import { UsuarioSistema, Mensaje, EventoCalendario, DocumentoFormato } from './app';

export const USUARIOS_PRUEBA: UsuarioSistema[] = [
  {
    id: 1,
    nombre: "Lic. Sofia Albarran Torres",
    usuario: "sofia.albarran",
    correo: "sofia.albarran@legislativo.test",
    area: "Secretaria de Administracion y Finanzas",
    rol: "Administrador",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Ing. Alejandro Mendoza Ruiz",
    usuario: "alejandro.mendoza",
    correo: "alejandro.mendoza@siintranet.test",
    area: "Direccion de Informatica",
    rol: "Usuario",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Dra. Elena Gomez Prado",
    usuario: "elena.gomez",
    correo: "elena.gomez@legislativo.test",
    area: "Secretaria Tecnica",
    rol: "Usuario",
    estado: "Activo"
  },
  {
    id: 4,
    nombre: "Mtro. Roberto Carlos Soto",
    usuario: "roberto.soto",
    correo: "roberto.soto@legislativo.test",
    area: "Unidad de Informacion, Planeacion, Programacion y Evaluacion",
    rol: "Usuario",
    estado: "Activo"
  },
  {
    id: 5,
    nombre: "Lic. Claudia Beltran Solis",
    usuario: "claudia.beltran",
    correo: "claudia.beltran@siintranet.test",
    area: "Direccion de Administracion y Desarrollo de Personal",
    rol: "Usuario",
    estado: "Activo"
  },
  {
    id: 6,
    nombre: "Lic. Miguel Angel Dominguez",
    usuario: "miguel.dominguez",
    correo: "miguel.dominguez@legislativo.test",
    area: "Direccion de Recursos Materiales",
    rol: "Usuario",
    estado: "Inactivo"
  },
  {
    id: 7,
    nombre: "Mtra. Gabriela Lujan Ortiz",
    usuario: "gabriela.lujan",
    correo: "gabriela.lujan@siintranet.test",
    area: "Unidad de Igualdad de Genero y Erradicacion de la Violencia",
    rol: "Usuario",
    estado: "Activo"
  },
  {
    id: 8,
    nombre: "Lic. Francisco Javier Perez",
    usuario: "francisco.perez",
    correo: "francisco.perez@legislativo.test",
    area: "Coordinacion de Normatividad",
    rol: "Usuario",
    estado: "Activo"
  }
];

export const MENSAJES_PRUEBA: Mensaje[] = [
  {
    id: 101,
    remitente: "Lic. Sofia Albarran Torres",
    titulo: "Convocatoria a Reunion Presupuestal 2026",
    descripcion: "Se convoca a todos los titulares de area a la reunion de revision del presupuesto anual para el ejercicio fiscal 2026.",
    fecha: "2026-06-25",
    hora: "09:30",
    documento: "Convocatoria_Presupuesto_2026.pdf",
    destinatarios: "Ing. Alejandro Mendoza Ruiz - Direccion de Informatica, Dra. Elena Gomez Prado - Secretaria Tecnica",
    estado: "Visto",
    tipoMensaje: "recibido",
    estadoLectura: "Visto",
    estadoRespuesta: "Pendiente"
  },
  {
    id: 102,
    remitente: "Dra. Elena Gomez Prado",
    titulo: "Minuta de la Sesion Ordinaria del Comite",
    descripcion: "Adjunto la minuta correspondiente a la sesion del dia de ayer para su revision y firmas correspondientes.",
    fecha: "2026-06-28",
    hora: "14:15",
    documento: "Minuta_Sesion_27062026.pdf",
    destinatarios: "Lic. Sofia Albarran Torres - Secretaria de Administracion y Finanzas",
    estado: "Nuevo",
    tipoMensaje: "recibido",
    estadoLectura: "Nuevo",
    estadoRespuesta: "Pendiente"
  },
  {
    id: 103,
    remitente: "Mtro. Roberto Carlos Soto",
    titulo: "Informe Trimestral de Evaluacion y Planeacion",
    descripcion: "Envio formal del informe trimestral consolidado para su validacion e integracion en la gaceta legislativa.",
    fecha: "2026-06-29",
    hora: "11:00",
    documento: "Informe_Trimestral_Evaluacion_Q2.pdf",
    destinatarios: "Lic. Sofia Albarran Torres - Secretaria de Administracion y Finanzas, Lic. Claudia Beltran Solis - Direccion de Administracion y Desarrollo de Personal",
    estado: "Respondido",
    tipoMensaje: "recibido",
    estadoLectura: "Visto",
    estadoRespuesta: "Respondido"
  },
  {
    id: 104,
    remitente: "Usuario del sistema",
    titulo: "Solicitud de Mantenimiento de Servidores",
    descripcion: "Requerimos programar una ventana de mantenimiento preventivo para los servidores de la intranet principal el proximo fin de semana.",
    fecha: "2026-06-30",
    hora: "16:45",
    documento: "Plan_Mantenimiento_Servidores.pdf",
    destinatarios: "Ing. Alejandro Mendoza Ruiz - Direccion de Informatica",
    estado: "Enviado",
    tipoMensaje: "enviado"
  },
  {
    id: 105,
    remitente: "Lic. Claudia Beltran Solis",
    titulo: "Actualizacion de Tabulador de Sueldos 2026",
    descripcion: "Remito la propuesta de ajuste al tabulador del personal de confianza para la aprobacion definitiva de la secretaria.",
    fecha: "2026-06-30",
    hora: "08:00",
    documento: "Propuesta_Tabulador_2026.pdf",
    destinatarios: "Lic. Sofia Albarran Torres - Secretaria de Administracion y Finanzas",
    estado: "Nuevo",
    tipoMensaje: "recibido",
    estadoLectura: "Nuevo",
    estadoRespuesta: "Pendiente"
  },
  {
    id: 106,
    remitente: "Mtra. Gabriela Lujan Ortiz",
    titulo: "Guia para la Igualdad de Genero en el Servicio Publico",
    descripcion: "Se comparte el manual actualizado de lineamientos para la erradicacion de la violencia de genero dentro de las instalaciones legislativas.",
    fecha: "2026-06-20",
    hora: "12:00",
    documento: "Guia_Igualdad_Genero_V2.pdf",
    destinatarios: "Ing. Alejandro Mendoza Ruiz - Direccion de Informatica, Dra. Elena Gomez Prado - Secretaria Tecnica, Lic. Claudia Beltran Solis - Direccion de Administracion y Desarrollo de Personal",
    estado: "Visto",
    tipoMensaje: "recibido",
    estadoLectura: "Visto",
    estadoRespuesta: "Pendiente"
  },
  {
    id: 107,
    remitente: "Lic. Francisco Javier Perez",
    titulo: "Dictamen de Reformas al Reglamento Interno",
    descripcion: "Presento el analisis normativo y el proyecto de reforma al reglamento de la ley organica para revision juridica.",
    fecha: "2026-06-27",
    hora: "10:30",
    documento: "Dictamen_Reformas_Reglamento_Interno.pdf",
    destinatarios: "Lic. Sofia Albarran Torres - Secretaria de Administracion y Finanzas, Dra. Elena Gomez Prado - Secretaria Tecnica",
    estado: "Visto",
    tipoMensaje: "recibido",
    estadoLectura: "Visto",
    estadoRespuesta: "Respondido"
  },
  {
    id: 108,
    remitente: "Usuario del sistema",
    titulo: "Envio de Cotizaciones de Equipo de Computo",
    descripcion: "Adjunto las tres cotizaciones recibidas de proveedores autorizados para la adquisicion de las nuevas estaciones de trabajo.",
    fecha: "2026-06-28",
    hora: "15:20",
    documento: "Cuadro_Comparativo_Cotizaciones.pdf",
    destinatarios: "Lic. Miguel Angel Dominguez - Direccion de Recursos Materiales",
    estado: "Enviado",
    tipoMensaje: "enviado"
  },
  {
    id: 109,
    remitente: "Lic. Miguel Angel Dominguez",
    titulo: "Requerimiento de Inventario de Bienes Muebles",
    descripcion: "Solicitud urgente para el llenado de las plantillas de inventario fisico del mobiliario asignado a sus respectivas oficinas.",
    fecha: "2026-06-15",
    hora: "09:00",
    documento: "Formato_Inventario_Bienes_Muebles.pdf",
    destinatarios: "Lic. Sofia Albarran Torres - Secretaria de Administracion y Finanzas, Ing. Alejandro Mendoza Ruiz - Direccion de Informatica",
    estado: "Eliminado",
    tipoMensaje: "recibido",
    estadoLectura: "Visto",
    estadoRespuesta: "Pendiente"
  },
  {
    id: 110,
    remitente: "Usuario del sistema",
    titulo: "Proyecto Cancelado: Taller de Capacitacion en Seguridad",
    descripcion: "Notificacion de la cancelacion del taller programado para el dia de mañana debido a problemas logisticos ajenos a la direccion.",
    fecha: "2026-06-29",
    hora: "17:00",
    documento: "Oficio_Cancelacion_Capacitacion.pdf",
    destinatarios: "Dra. Elena Gomez Prado - Secretaria Tecnica, Lic. Claudia Beltran Solis - Direccion de Administracion y Desarrollo de Personal",
    estado: "Cancelado",
    tipoMensaje: "enviado"
  }
];

export const RECORDATORIOS_PRUEBA: EventoCalendario[] = [
  {
    id: 1,
    fecha: "2026-07-01",
    tipo: "recordatorio",
    titulo: "Recordatorio",
    descripcion: "Revisar la bandeja de entrada para documentos pendientes de firma",
    hora: "09:00"
  },
  {
    id: 2,
    fecha: "2026-07-01",
    tipo: "recordatorio",
    titulo: "Recordatorio",
    descripcion: "Subir informe consolidado trimestral al modulo de formatos",
    hora: "13:00"
  },
  {
    id: 3,
    fecha: "2026-07-02",
    tipo: "recordatorio",
    titulo: "Recordatorio",
    descripcion: "Sesion de capacitacion sobre el nuevo reglamento de la intranet",
    hora: "11:30"
  },
  {
    id: 4,
    fecha: "2026-07-03",
    tipo: "recordatorio",
    titulo: "Recordatorio",
    descripcion: "Reunion de seguimiento con la Direccion de Informatica",
    hora: "16:00"
  },
  {
    id: 5,
    fecha: "2026-07-05",
    tipo: "recordatorio",
    titulo: "Recordatorio",
    descripcion: "Fecha limite para entrega de solicitudes presupuestarias adicionales",
    hora: "18:00"
  }
];

export const DOCUMENTOS_FORMATOS_PRUEBA: { [categoria: string]: DocumentoFormato[] } = {
  "Formatos": [
    { nombre: "Formato de Solicitud de Viáticos", archivo: "Formato_Solicitud_Viaticos.pdf" },
    { nombre: "Formato de Registro de Visitas Especiales", archivo: "Formato_Registro_Visitas.pdf" },
    { nombre: "Formato de Requisición de Bienes y Materiales", archivo: "Formato_Requisicion_Materiales.pdf" }
  ],
  "Secretaría de Administración y Finanzas": [
    { nombre: "Manual de Organización y Procedimientos Administrativos", archivo: "Manual_Procedimientos_Administrativos.pdf" },
    { nombre: "Calendario de Programación Presupuestal 2026", archivo: "Calendario_Presupuestal_2026.pdf" }
  ],
  "Secretaría Particular": [
    { nombre: "Guía de Atención Ciudadana e Interinstitucional", archivo: "Guia_Atencion_Ciudadana.pdf" }
  ],
  "Secretaría Técnica": [
    { nombre: "Reglamento Interno para Sesiones de Comité", archivo: "Reglamento_Sesiones_Comite.pdf" }
  ],
  "Unidad de Información, Planeación, Programación y Evaluación": [
    { nombre: "Plan de Desarrollo Institucional 2026", archivo: "Plan_Desarrollo_Institucional_2026.pdf" },
    { nombre: "Metodología de Evaluación del Desempeño Operativo", archivo: "Metodologia_Evaluacion_Desempeno.pdf" }
  ],
  "Coordinación de Normatividad": [
    { nombre: "Compendio de Leyes y Reglamentos del Estado de México", archivo: "Compendio_Leyes_Reglamentos_Edomex.pdf" }
  ],
  "Unidad de Igualdad de Género y Erradicación de la Violencia": [
    { nombre: "Protocolo de Prevención del Acoso y Hostigamiento", archivo: "Protocolo_Prevencion_Acoso.pdf" }
  ],
  "Dirección de Administración y Desarrollo de Personal": [
    { nombre: "Código de Conducta para Servidores Públicos", archivo: "Codigo_Conducta_Servidores_Publicos.pdf" },
    { nombre: "Programa de Capacitación Anual 2026", archivo: "Programa_Capacitacion_Anual_2026.pdf" }
  ],
  "Dirección de Recursos Materiales": [
    { nombre: "Lineamientos de Adquisiciones, Arrendamientos y Servicios", archivo: "Lineamientos_Adquisiciones_Arrendamientos.pdf" }
  ],
  "Dirección de Finanzas": [
    { nombre: "Guía de Comprobación de Gasto Corriente", archivo: "Guia_Comprobacion_Gasto_Corriente.pdf" }
  ],
  "Dirección de Informática": [
    { nombre: "Políticas Generales de Seguridad de la Información", archivo: "Politicas_Seguridad_Informacion.pdf" },
    { nombre: "Manual de Usuario del Portal SIIntranet", archivo: "Manual_Usuario_SIIntranet.pdf" }
  ]
};
