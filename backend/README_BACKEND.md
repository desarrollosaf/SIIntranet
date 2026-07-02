# SIIntranet Backend - Base Inicial

Este proyecto constituye la base inicial del backend para la intranet del Poder Legislativo del Estado de México (SIIntranet). Está desarrollado utilizando **NestJS** y configurado para servir como API REST para el cliente de Angular.

---

## Estructura de Módulos Creados
Todos los módulos de la aplicación se ubican en `src/modules/` y cuentan con sus respectivos controladores, servicios y módulos:

1. **health**: Endpoint de verificación de estado y salud general de la API.
2. **auth**: Gestión inicial de autenticación.
3. **usuarios**: Gestión de cuentas de usuario del sistema.
4. **mensajes**: Servicio de mensajería digital e institucional.
5. **formatos**: Módulo de categorías y archivos de formato.
6. **recordatorios**: Gestión de calendario y recordatorios asociados.
7. **archivos**: Gestión de almacenamiento y subida de archivos adjuntos.

---

## Rutas Iniciales Disponibles
Todas las rutas de la API utilizan el prefijo global `/api` configurado en `src/main.ts`:

* **Salud del Sistema:**
  * `GET /api/health` — Verifica el estado de salud del backend y la hora actual del servidor.
* **Endpoints de Estado (Mock status):**
  * `GET /api/auth/status`
  * `GET /api/usuarios/status`
  * `GET /api/mensajes/status`
  * `GET /api/formatos/status`
  * `GET /api/recordatorios/status`
  * `GET /api/archivos/status`

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
* ⚠️ **Base de Datos (MySQL):** No está conectada todavía. Los módulos responden con estados mock indicando `"database": "not-connected"`.
* ⚠️ **Seguridad (JWT/Auth):** La autenticación real mediante tokens JWT no está implementada todavía.
* ⚠️ **Consumo de Angular:** El frontend Angular consumirá esta API desde `http://localhost:3000/api` una vez que se inicie la fase de llamadas HTTP.
