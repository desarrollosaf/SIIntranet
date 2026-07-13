# Backend SIIntranet

Backend desarrollado con NestJS.

## Instalación y Ejecución

```bash
npm install
cp .env.example .env
npm run start:dev
```

## Endpoints
Base URL: `http://localhost:3000/api`

- `GET /health`
- `POST /auth/login`
- `GET/POST/PATCH/DELETE` en `/usuarios`, `/mensajes`, `/formatos` y `/recordatorios`

## Estado
Temporalmente en memoria (sin base de datos real ni JWT).
