# SIIntranet

Intranet institucional del Poder Legislativo del Estado de México — Secretaría de Administración y Finanzas, con mensajería interna, repositorio de formatos y administración de usuarios.

> SIIntranet V2 es una reconstrucción completa del sistema sobre una arquitectura nueva de frontend y backend, construida a partir del comportamiento funcional validado en la versión anterior. Las decisiones de diseño y el inventario funcional que la originaron se documentan en [`docs/`](docs/).

## Módulos implementados

| Módulo | Descripción | Acceso |
|---|---|---|
| Inicio | Panel de bienvenida con mensajes recientes y enlaces institucionales | Cualquier sesión |
| Mensajería | Redacción, bandeja de recibidos/enviados, detalle, respuesta, edición, cancelación y eliminación de mensajes con adjuntos reales y destinatarios múltiples con estado de lectura independiente por destinatario | Cualquier sesión |
| Formatos | Consulta y descarga de documentos institucionales agrupados por categoría | Cualquier sesión |
| Administración de usuarios | Búsqueda/filtros, edición, activación/desactivación de cuentas, con reglas de integridad (no auto-desactivación, no dejar el sistema sin Administradores activos) | Solo Administrador |

El alta de usuarios (creación de cuentas) no está implementada todavía: D05 (`docs/decisiones-funcionales-v2.md`) establece que el Administrador debe poder crear usuarios, pero es un punto de extensión pendiente de construcción, no una decisión sin resolver. Calendario/recordatorios quedaron identificados durante el diseño pero están **fuera del alcance actual**. La administración visual de Formatos sigue como decisión pendiente (no bloquea la consulta/descarga ya implementada), y un módulo de auditoría está aprobado pero todavía no construido. Ver [`docs/decisiones-funcionales-v2.md`](docs/decisiones-funcionales-v2.md).

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

SIIntranet V2 está en desarrollo activo, con los módulos de la tabla anterior implementados y probados de extremo a extremo. Dos decisiones estructurales siguen pendientes de definición institucional antes de un despliegue productivo:

- **Persistencia:** los datos de Usuarios, Mensajes, Formatos y la metadata de Archivos viven en memoria del proceso backend (se pierden al reiniciar). Los binarios de los archivos adjuntos (mensajes y formatos) sí se escriben en disco, en `backend/storage/archivos/` — pero es almacenamiento local del servidor de desarrollo, no una estrategia de persistencia definitiva. La integración con la base de datos MySQL institucional está pendiente de que se autorice y se conozca su esquema (ver D05 en `docs/decisiones-funcionales-v2.md`).
- **Autenticación:** el backend expone una identidad de desarrollo provisional (`AUTH_MODE=development`, activa solo junto con `NODE_ENV=development`), que fija la sesión a un usuario configurado por variable de entorno del servidor — sin login real, sin contraseñas ni tokens. El mecanismo de autenticación definitivo está diferido (ver D08).

La autorización por rol (`Administrador`/`Usuario`), en cambio, sí está implementada de forma real en el backend mediante guards, independientemente de qué mecanismo de autenticación esté activo.

## Configuración por entorno

El frontend resuelve la URL base de la API según el entorno de build (`frontend/src/environments/`):

| Entorno | `apiBaseUrl` |
|---|---|
| Desarrollo (`ng serve` / `npm start`) | `http://localhost:3000/api` |
| Producción (`npm run build`) | `/api` (ruta relativa al mismo origen que sirve el frontend) |

En producción el frontend espera que la API se exponga bajo `/api` en el mismo origen; el despliegue institucional definitivo (dominio, proxy/reverse-proxy, TLS) todavía está pendiente de definirse.

## Última validación conocida

- Frontend: 362/362 pruebas unitarias (Vitest).
- Backend: 124/124 pruebas unitarias (Jest).
- Backend: 80/80 pruebas end-to-end (Jest + Supertest contra la aplicación real).

Estos números corresponden a la última validación registrada y pueden cambiar conforme el proyecto avance; no sustituyen ejecutar las pruebas localmente antes de confiar en un cambio.

## Documentación

- [`docs/inventario-funcional-v1.md`](docs/inventario-funcional-v1.md) — inventario funcional de la versión anterior del sistema, usado como referencia de comportamiento.
- [`docs/decisiones-funcionales-v2.md`](docs/decisiones-funcionales-v2.md) — decisiones funcionales resueltas, diferidas y pendientes.
- [`docs/arquitectura-v2.md`](docs/arquitectura-v2.md) — diseño arquitectónico de V2.
