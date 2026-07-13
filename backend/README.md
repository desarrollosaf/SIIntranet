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

Ejemplo:
```env
PORT=3000
FRONTEND_URL=http://localhost:4200
```

## Endpoints
Base URL: `http://localhost:3000/api`

- `GET /health`
- `POST /auth/login`
- `GET/POST/PATCH/DELETE` en `/usuarios`, `/mensajes`, `/formatos` y `/recordatorios`

## Estado
Temporalmente en memoria (sin base de datos real ni JWT).
