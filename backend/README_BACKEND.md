# SIIntranet Backend - Base Inicial con Contratos de API

Este proyecto constituye el backend para la intranet del Poder Legislativo del Estado de México (SIIntranet). Está desarrollado utilizando **NestJS** y configurado para servir como API REST para el cliente de Angular.

---

## Estructura de Módulos Creados
Todos los módulos de la aplicación se ubican en `src/modules/` y cuentan con sus respectivos controladores, servicios y módulos:

1. **health**: Endpoint de verificación de estado y salud general de la API.
2. **auth**: Gestión inicial y simulación de inicio de sesión.
3. **usuarios**: Gestión de cuentas de usuario del sistema (CRUD completo en memoria).
4. **mensajes**: Servicio de envío, recepción y edición de mensajes institucionales (CRUD completo en memoria).
5. **formatos**: Módulo de categorías y archivos de formato.
6. **recordatorios**: Gestión de calendario y recordatorios asociados.
7. **archivos**: Gestión de almacenamiento y subida de archivos adjuntos.

---

## Rutas de la API (Fase 2 - Contratos de API)
Todas las rutas de la API utilizan el prefijo global `/api` configurado en `src/main.ts`:

### 🔑 Autenticación (Módulo `auth`)
* `POST /api/auth/login` — Autenticación simulada.
  * **Cuerpo (LoginDto):** `{ "usuario": "admin", "password": "any" }`
  * **Reglas:**
    * Si el usuario es `"admin"`, responde con privilegios de **Administrador**.
    * Si el usuario coincide con algún registro en memoria (`/usuarios`), inicia con dicho perfil.
    * Cualquier otro texto inicia sesión como **Usuario Normal**.
* `GET /api/auth/status` — Endpoint de verificación de estado.

### 👥 Usuarios (Módulo `usuarios` - CRUD en Memoria)
* `GET /api/usuarios` — Lista todos los usuarios en memoria.
* `GET /api/usuarios/:id` — Obtiene los detalles de un usuario específico.
* `POST /api/usuarios` — Registra un nuevo usuario.
  * **Cuerpo (CreateUsuarioDto):** `{ "nombre": "...", "usuario": "...", "correo": "...", "area": "...", "rol": "...", "estado": "..." }`
* `PATCH /api/usuarios/:id` — Actualiza información de un usuario.
  * **Cuerpo (UpdateUsuarioDto):** Campos opcionales a modificar.
* `PATCH /api/usuarios/:id/password` — Actualiza manualmente la contraseña de un usuario.
  * **Cuerpo (ChangePasswordDto):** `{ "passwordNueva": "..." }`
* `DELETE /api/usuarios/:id` — Desactiva a un usuario (cambia su estado a `"Inactivo"` sin borrarlo físicamente).
* `GET /api/usuarios/status` — Endpoint de verificación de estado.

### ✉️ Mensajería (Módulo `mensajes` - CRUD en Memoria)
* `GET /api/mensajes` — Lista todos los mensajes en memoria (excluye eliminados).
* `GET /api/mensajes/recibidos` — Obtiene los mensajes con tipo `"recibido"`.
* `GET /api/mensajes/enviados` — Obtiene los mensajes con tipo `"enviado"`.
* `GET /api/mensajes/:id` — Obtiene el detalle de un mensaje específico.
* `POST /api/mensajes` — Registra un nuevo mensaje enviado.
  * **Cuerpo (CreateMensajeDto):** `{ "titulo": "...", "descripcion": "...", "remitente": "...", "destinatarios": "...", "documento": "..." }`
* `PATCH /api/mensajes/:id` — Edita las propiedades de un mensaje en memoria.
* `DELETE /api/mensajes/:id` — Marca un mensaje como `"Eliminado"` (sin borrarlo físicamente).
* `GET /api/mensajes/status` — Endpoint de verificación de estado.

### 📁 Formatos Oficiales (Módulo `formatos` - CRUD en Memoria)
* `GET /api/formatos` — Lista todos los formatos activos en memoria.
* `GET /api/formatos/categoria/:categoria` — Obtiene los formatos de una categoría específica.
* `GET /api/formatos/:id` — Obtiene el detalle de un formato específico.
* `POST /api/formatos` — Registra un nuevo formato.
  * **Cuerpo (CreateFormatoDto):** `{ "nombre": "...", "descripcion": "...", "categoria": "...", "archivo": "...", "tipoArchivo": "...", "estado": "..." }`
* `PATCH /api/formatos/:id` — Actualiza información de un formato.
* `DELETE /api/formatos/:id` — Marca un formato como `"Inactivo"` (sin borrarlo físicamente).
* `GET /api/formatos/status` — Endpoint de verificación de estado.

### 📅 Recordatorios (Módulo `recordatorios` - CRUD en Memoria)
* `GET /api/recordatorios` — Lista todos los recordatorios activos (no eliminados).
* `GET /api/recordatorios/fecha/:fecha` — Obtiene los recordatorios para una fecha específica (formato YYYY-MM-DD).
* `GET /api/recordatorios/:id` — Obtiene el detalle de un recordatorio específico.
* `POST /api/recordatorios` — Registra un nuevo recordatorio.
  * **Cuerpo (CreateRecordatorioDto):** `{ "titulo": "...", "descripcion": "...", "fecha": "...", "hora": "...", "tipo": "recordatorio", "creadoPor": "..." }`
* `PATCH /api/recordatorios/:id` — Actualiza información de un recordatorio.
* `DELETE /api/recordatorios/:id` — Marca un recordatorio como `"Eliminado"` (sin borrarlo físicamente).
* `GET /api/recordatorios/status` — Endpoint de verificación de estado.

### 📁 Otros Módulos
* `GET /api/health` — Verificación de salud.
* `GET /api/archivos/status` — Módulo Archivos.

---

## Configuración y Variables de Entorno
Se utiliza `@nestjs/config` para manejar variables de entorno. Puedes basarte en el archivo `.env.example` en la raíz del backend:

```env
PORT=3000
FRONTEND_URL=http://localhost:4200
NODE_ENV=development
```

---

## Instalación y Ejecución

### 1. Instalar dependencias
Desde la carpeta `backend/`, ejecuta:
```bash
npm install
```

### 2. Ejecutar en modo desarrollo (con recarga automática)
```bash
npm run start:dev
```

### 3. Compilar para producción
```bash
npm run build
```

### 4. Ejecutar pruebas unitarias
```bash
npm run test
```

---

## Estado Actual de la Integración
* ⚠️ **Base de Datos (MySQL):** No está conectada todavía. Las bases de datos se simulan con arreglos en memoria en los servicios de NestJS.
* ⚠️ **Archivos / Storage:** No se guardan ni procesan archivos físicos (los nombres de archivos son solo campos de texto).
* ⚠️ **Seguridad (JWT/Auth):** La autenticación real mediante tokens JWT no está activa todavía (los tokens retornados en login son `null`).
* 🔗 **Conexión Frontend-Backend:** Login, Usuarios y Mensajes ya están completamente conectados y operativos en el frontend de Angular. Los módulos de Formatos y Recordatorios tienen endpoints preparados en memoria en el backend, listos para su posterior integración en el frontend.
