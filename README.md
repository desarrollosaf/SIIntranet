# SIIntranet

Sistema de intranet institucional para mensajería interna, gestión de formatos, calendario y administración de usuarios.

> SIIntranet V2 es una reconstrucción completa del sistema, con arquitectura nueva de frontend y backend. Las decisiones de diseño y el inventario funcional que la originaron se documentan en [`docs/`](docs/).

## Estructura del repositorio

```
SIIntranet/
├── frontend/   # Aplicación Angular 22
├── backend/    # API NestJS 11
└── docs/       # Inventario funcional, decisiones y arquitectura de V2
```

## Requisitos

- Node.js
- npm

## Frontend (Angular 22)

```bash
cd frontend
npm install
npm start
```
Sirve en `http://localhost:4200`.

```bash
npm run build   # build de producción
npm test         # pruebas unitarias (Vitest)
```

## Backend (NestJS 11)

```bash
cd backend
npm install
npm run start:dev
```
Expone la API en `http://localhost:3000`.

```bash
npm run build     # compilar
npm test           # pruebas unitarias (Jest)
npm run test:e2e   # pruebas end-to-end
```

## Estado del proyecto

SIIntranet V2 está en desarrollo activo. La integración con la base de datos MySQL institucional y la estrategia de autenticación definitiva todavía están pendientes de definir.

## Documentación

- [`docs/inventario-funcional-v1.md`](docs/inventario-funcional-v1.md) — inventario funcional de la versión anterior del sistema, usado como referencia de comportamiento.
- [`docs/decisiones-funcionales-v2.md`](docs/decisiones-funcionales-v2.md) — decisiones funcionales resueltas, diferidas y pendientes.
- [`docs/arquitectura-v2.md`](docs/arquitectura-v2.md) — diseño arquitectónico de V2.
