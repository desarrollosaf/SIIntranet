export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  correo: string;
  area: string;
  rol: string; // e.g. 'Administrador' | 'Usuario'
  estado: 'Activo' | 'Inactivo';
  password?: string;
  requiereCambioPassword?: boolean;
}

export interface ArchivoAdjunto {
  nombre: string;
  archivo: string;
}

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
}

export interface LoginRequest {
  usuario: string;
  password?: string;
}

export interface LoginResponse {
  user: {
    id: number;
    nombre: string;
    usuario: string;
    rol: string;
  };
  requiresPasswordChange: boolean;
  token: string | null;
  mode: 'mock';
}

export interface Formato {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  archivo: string;
  tipoArchivo: string;
  fechaCreacion: string;
  estado: 'Activo' | 'Inactivo';
}

export interface Recordatorio {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  tipo: 'recordatorio';
  estado: 'Activo' | 'Inactivo' | 'Eliminado';
  creadoPor: string;
}
