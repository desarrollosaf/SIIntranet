# SIIntranet

Intranet con frontend Angular y backend NestJS.

## Estructura
- `src/`: frontend Angular
- `backend/`: backend NestJS
- `public/`: recursos públicos
- `reportes-locales/`: reportes locales (fuera de Git)

## Instalación y Ejecución

**Frontend:**
```bash
npm install
npm run start
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

## URLs y Acceso
- Frontend: http://localhost:4200
- Backend: http://localhost:3000/api
- Credenciales: admin / 123

## Estado actual
Funciona con datos temporales en memoria RAM. Pendiente conectar base de datos MySQL real y JWT.
