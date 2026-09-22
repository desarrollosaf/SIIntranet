# SIIntranet V2

SIIntranet es una intranet para apoyar la comunicación y la consulta de información dentro de la institución.

Esta rama contiene la reconstrucción actual del sistema. Incluye una aplicación web desarrollada con Angular y una API desarrollada con NestJS.

## Funciones disponibles

- Inicio con accesos y mensajes recientes.
- Mensajería interna con bandejas, respuestas y archivos adjuntos.
- Consulta y descarga de formatos institucionales.
- Administración de usuarios y permisos por rol.

## Estado actual

El proyecto está en desarrollo y funciona localmente. Antes de utilizarlo en producción todavía es necesario definir e implementar:

- la conexión con la base de datos institucional;
- el inicio de sesión definitivo;
- la creación de cuentas de usuario;
- el módulo de auditoría;
- la estrategia final para almacenar archivos;
- la infraestructura y configuración de despliegue.

Por ahora, la información principal se guarda en memoria y se pierde cuando se reinicia el backend. Los archivos adjuntos se almacenan localmente en el servidor de desarrollo.

## Requisitos

- Node.js
- npm

## Instalación

Instala las dependencias del frontend:

```powershell
cd frontend
npm install
```

Instala las dependencias del backend y crea su archivo de configuración:

```powershell
cd ..\backend
npm install
Copy-Item .env.example .env
```

Para trabajar localmente, configura estas variables en `backend/.env`:

```env
NODE_ENV=development
AUTH_MODE=development
DEV_USER_ID=dev-usuario-1
```

## Ejecución

Abre dos terminales desde la carpeta del proyecto.

Backend:

```powershell
cd backend
npm run start:dev
```

Frontend:

```powershell
cd frontend
npm start
```

Después abre `http://localhost:4200` en el navegador. La API estará disponible en `http://localhost:3000/api`.

## Validación

Frontend:

```powershell
cd frontend
npm run build
npm test -- --watch=false
```

Backend:

```powershell
cd backend
npm run build
npm test
npm run test:e2e
```
