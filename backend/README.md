# Backend SIIntranet

Backend desarrollado con NestJS.

## Instalación y Ejecución

```bash
npm install
cp .env.example .env
npm run start:dev
```

## Variables de entorno

El backend usa el archivo `.env`.

Variables actuales:
- `PORT`: puerto donde corre la API. Por defecto `3000`.
- `FRONTEND_URL`: URL permitida para CORS. Por defecto `http://localhost:4200`.

Variables futuras de Base de Datos (integración en la próxima fase):
- `DB_HOST`: Host de la base de datos MySQL (ej: `localhost`).
- `DB_PORT`: Puerto de la base de datos MySQL (ej: `3306`).
- `DB_USERNAME`: Usuario de la base de datos MySQL.
- `DB_PASSWORD`: Contraseña de la base de datos MySQL.
- `DB_NAME`: Nombre de la base de datos MySQL.

> **Nota:** Actualmente el backend sigue almacenando la información en memoria. Estas variables de conexión a base de datos serán configuradas y consumidas en la siguiente fase de desarrollo.

Ejemplo de `.env`:
```env
PORT=3000
FRONTEND_URL=http://localhost:4200

# Configuración futura de base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=siintranet_db
```

## Endpoints
Base URL: `http://localhost:3000/api`

- `GET /health`
- `POST /auth/login`
- `GET/POST/PATCH/DELETE` en `/usuarios`, `/mensajes`, `/formatos` y `/recordatorios`

## Estado
Temporalmente en memoria (sin base de datos real ni JWT).
