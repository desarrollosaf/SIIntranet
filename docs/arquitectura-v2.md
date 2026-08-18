# Arquitectura de SIIntranet V2

Diseño arquitectónico completo de la reconstrucción de SIIntranet, elaborado a partir del inventario funcional de V1 (`docs/inventario-funcional-v1.md`) y de las decisiones funcionales ya resueltas (`docs/decisiones-funcionales-v2.md`). Documento puramente de diseño: no contiene código, no define tablas de base de datos, no elige ORM ni tecnología de autenticación definitiva.

Estructura de este documento: **Contexto previo** (por qué había información suficiente para diseñar) → **Diseño arquitectónico** (razonamiento y alternativas consideradas) → **Arquitectura final revisada** (versión vigente, aprobada con ajustes — sustituye al diseño inicial donde corresponde).

> **Nota global de alcance (ETAPA 14B):** este documento conserva íntegramente decisiones, alternativas y propuestas arquitectónicas históricas, incluidas varias secciones anteriores a esta nota que mencionan Calendario/Recordatorios como módulo, ruta, componente, dependencia de estado o punto de extensión previsto en el diseño original. El responsable del proyecto confirmó posteriormente que Calendario y Recordatorios están **FUERA DEL ALCANCE ACTUAL** de SIIntranet V2. Ninguna referencia histórica a Calendario/Recordatorios en este documento —anterior o posterior a esta nota— debe interpretarse como instrucción vigente de implementación. La sección **PARTE III — Arquitectura final revisada** contiene, además, las anotaciones reconciliadas puntuales correspondientes. Ver también `docs/decisiones-funcionales-v2.md` (D18) y `docs/inventario-funcional-v1.md`.

---

## Contexto previo al diseño

### ¿Había información suficiente para iniciar el diseño arquitectónico?

**Sí.** Las decisiones que condicionan la estructura del sistema (roles, ciclo de vida de mensajes, destinatarios y estados individuales, adjuntos reales, tipos de archivo, auditoría) quedaron resueltas o resueltas provisionalmente. Las que seguían abiertas (autenticación definitiva, recuperación y política de contraseñas, esquema físico de MySQL institucional, administración de Formatos, categorías, ancho móvil formal, PDF real, comportamiento exacto calendario→detalle, estándar de accesibilidad formal) no requerían resolverse antes, siempre que el diseño arquitectónico las tratara explícitamente como **puntos de extensión aislados** en vez de resolverlas por su cuenta.

Condiciones respetadas durante todo el diseño:
- No diseñar la base de datos física ni elegir ORM/driver (depende del esquema institucional aún no autorizado — D05).
- No comprometerse con una tecnología de autenticación concreta; diseñar únicamente el punto de extensión que permita sustituir el mecanismo más adelante (D08).
- No fijar política de contraseñas ni flujo de recuperación; dejarlos aislados/configurables (D15, D16).
- No inventar estructura para lo aún no definido (Formatos, categorías, ancho móvil, PDF, accesibilidad formal, calendario↔detalle): documentarlo como punto de extensión, no como diseño cerrado.
- Mantener conceptualmente el flujo de V1 (login/logout/cambio obligatorio) como implementación provisional donde sea razonable, sin heredar sus fallas de seguridad como si fueran requisitos.

### Agenda de diseño (temario original, ya cubierto en las secciones siguientes)

1. Organización general del repositorio. 2. Separación frontend/backend. 3. Arquitectura Angular. 4. Páginas y componentes por responsabilidad. 5. Angular Router. 6. Servicios por dominio. 7. Modelos/interfaces. 8. Shared/core/layout. 9. Estado local vs. compartido. 10. Manejo HTTP y errores. 11. Arquitectura NestJS. 12. Módulos de backend. 13. DTOs y validación. 14. Capa de persistencia preparada para MySQL institucional (sin diseñarla físicamente). 15. Autenticación desacoplada. 16. Autorización real Administrador/Usuario. 17. Modelo conceptual de mensajería multidestinatario con estados individuales. 18. Archivos reales. 19. Auditoría. 20. Testing. 21. Responsive y accesibilidad desde el inicio. 22. Estrategia para retirar V1.

---

## PARTE II — Diseño arquitectónico (razonamiento y alternativas)

Todo lo siguiente fue diseño, no implementación: no se creó, movió ni eliminó ningún archivo real; no se instaló nada; no se ejecutó `ng new`/`nest new`; no hubo operaciones de Git. Se respetaron las restricciones explícitas: sin base de datos física, sin ORM/driver, sin autenticación definitiva, sin autenticación mock de V1 reutilizada literalmente, evitando capas/patrones no justificados para el tamaño real del proyecto (SPA + API para una intranet institucional de un solo organismo, no un sistema distribuido de gran escala).

**Nota:** esta Parte II es el registro del razonamiento inicial. La sección **Arquitectura final revisada** (más abajo) incorpora ajustes obligatorios aprobados posteriormente y **sustituye** a esta parte donde corresponda (especialmente la estrategia de retiro de V1 y algunos detalles de organización de features — se indica en cada caso).

### A. Arquitectura general del repositorio

Un único repositorio (no un monorepo con herramienta dedicada), con dos aplicaciones hermanas y explícitas en la raíz, más una carpeta de documentación versionada (`docs/`, este mismo conjunto de documentos).

**Por qué mover el frontend a `frontend/`:** hoy el Angular vive implícitamente en la raíz (`src/`, `angular.json`, `package.json` de nombre `"frontend"`) mientras el backend ya está en su propia carpeta — es una asimetría real del repo actual. Igualarlos deja la raíz del repo limpia y hace explícito el límite entre las dos aplicaciones.

**Por qué NO una herramienta de monorepo (Nx, Turborepo, pnpm workspaces):** solo hay dos aplicaciones, sin paquetes compartidos compilados entre ellas ni necesidad de orquestar builds — se comunican únicamente por HTTP. Añadir tooling de monorepo sería complejidad sin beneficio medible (sobrearquitectura).

### B. Arquitectura frontend Angular (versión inicial — ver árbol final revisado más abajo)

Reemplaza el componente único `App` (2406 líneas de lógica + 1559 de plantilla) por una organización **por responsabilidad**, en tres capas conceptuales: `core/` (infraestructura transversal sin UI propia), `shared/` (piezas de UI reutilizables sin dueño de dominio) y `features/` (cada dominio funcional con sus páginas, componentes, servicio(s) y modelos).

### C. Mapa funcional → arquitectura (versión inicial — ver tabla final revisada en Parte III)

Cada pantalla/modal del inventario de V1 se mapeó a: página/ruta (o no), componente propio, componente compartido, servicio y modelo. Ver la versión final y corregida en la Parte III §5-6.

### D. Routing (versión inicial — ver rutas finales en Parte III §4)

**Nota sobre Calendario:** en V1 es un modal disparado desde Inicio; se decidió elevarlo a ruta propia (`/calendario`) porque Angular Router es el mecanismo principal de navegación del proyecto, y una ruta propia permite enlace directo, botón "atrás" del navegador y recarga sin perder contexto — mejora estructural, no funcional.

### E. Componentización — criterio (vigente, sin cambios)

Algo se convierte en su propio componente cuando cumple **al menos una** de estas condiciones:
1. Se reutiliza en 2 o más lugares (`estado-badge`, `empty-state`, `confirm-dialog`).
2. Tiene suficiente estado/comportamiento propio como para ser probable unidad de prueba independiente y, de quedarse inline, abultaría la página que lo contiene (`destinatarios-selector`, `calendario-grid`, `mensaje-detalle-modal`).
3. Representa un objeto de dominio renderizado como ítem de lista, con sus propias acciones contextuales (`mensaje-list-item`, fila de usuario en `usuarios-page`).

Algo **no** se convierte en componente cuando es una interpolación o bloque de marcado sin lógica propia usado una sola vez. El objetivo es evitar los dos extremos de riesgo: el monolito de V1 (todo en una clase de 2406 líneas) y la fragmentación excesiva (un componente por cada `@if`).

### F. Servicios frontend (versión inicial — ver corrección en Parte III §6)

### G. Estado (vigente, sin cambios)

- **Local (por página/componente):** valores de formularios, filtros de búsqueda/tablas, fila u opción seleccionada, mes/año visible del calendario, qué modal específico está abierto.
- **Compartido (servicio singleton en `core/`):** sesión de usuario actual (`auth.service`), lista de notificaciones activas, estado del diálogo de confirmación genérico.
- **Derivado (calculado, nunca almacenado aparte):** listas filtradas/ordenadas, conteo de mensajes nuevos, eventos combinados del calendario.

**No se elige una librería de estado (NgRx, Signals-store, Akita, etc.):** el volumen de estado realmente compartido es pequeño (sesión + notificaciones + un diálogo); Signals/servicios nativos de Angular bastan. Introducir una librería de estado sería sobrearquitectura para este tamaño de proyecto.

### H. Arquitectura backend NestJS

```
backend/
└── src/
    ├── app.module.ts
    ├── main.ts
    ├── common/
    │   ├── interfaces/
    │   └── decorators/
    │       └── roles.decorator.ts      # @Roles('Administrador')
    └── modules/
        ├── auth/            # implementación provisional intercambiable (D08)
        ├── usuarios/        # lectura (cualquier sesión) + administración (Administrador)
        ├── mensajes/        # modelo Mensaje + Destinatario individual (ver §J)
        ├── recordatorios/   # FUERA DE ALCANCE ACTUAL — ver nota de alcance ETAPA 14B
        ├── formatos/
        ├── archivos/        # subida/almacenamiento/descarga reales (D03/D17)
        ├── auditoria/       # nuevo (D14)
        └── health/
```

| Módulo | Responsabilidad | Límites con otros módulos |
|---|---|---|
| `auth` | Login, sesión actual, cambio obligatorio; punto único de "quién es el usuario actual" | Consulta a `usuarios` para credenciales; ningún otro módulo reimplementa lógica de sesión |
| `usuarios` | CRUD, activar/desactivar, reset administrativo de password | No conoce mensajes/formatos; dispara eventos hacia `auditoria` |
| `mensajes` | Ciclo de vida del mensaje + destinatarios individuales con estado propio (§J) | Depende de `usuarios` y `archivos`; dispara eventos hacia `auditoria` |
| `recordatorios` | **FUERA DE ALCANCE ACTUAL** (ver nota de alcance, ETAPA 14B) — CRUD de recordatorios personales | Independiente |
| `formatos` | CRUD de documentos institucionales | A la espera de D04 |
| `archivos` | Subida/almacenamiento/descarga real de adjuntos | Consumido por `mensajes` y `formatos` |
| `auditoria` | Registro y consulta de acciones relevantes, solo-Administrador | Invocado puntualmente por `auth`, `usuarios`, `mensajes`, `formatos`; nunca al revés |
| `health` | Estado de infraestructura | Sin dependencias |

### I. Persistencia — frontera conceptual (sin tablas, sin ORM)

**Regla de diseño única y explícita:** *la persistencia vive exclusivamente detrás del `Service` de cada módulo de dominio; ningún Controller, DTO expuesto ni el frontend conocen jamás el esquema físico de MySQL.* Cuando se conecte la base institucional, el cambio queda contenido dentro de esos mismos `Service`, sin alterar el contrato HTTP.

**Por qué no se propone ya una interfaz `Repository` genérica desacoplada del ORM:** abstraer sobre un esquema y un motor de persistencia todavía desconocidos sería diseñar una interfaz especulativa. La única frontera que se fija ahora es organizativa (un módulo, un dueño de sus datos), no técnica.

### J. Mensajería — diseño conceptual (sin tablas físicas)

V1 modelaba un único objeto `Mensaje` con estado global. Para cumplir D02/D10/D11/D12/D13/D17 ya resueltas, el concepto se separa en dos:

- **Mensaje** — el documento en sí: remitente, título, descripción, adjuntos, fecha/hora, y un estado **general** (`Enviando|Enviado|Cancelado|Eliminado`).
- **Destinatario del mensaje** — una relación por cada persona a la que se envió: referencia al mensaje, referencia al usuario destinatario, estado de lectura (`Nuevo|Visto`) y estado de respuesta (`Pendiente|Respondido`) propios e independientes.

Cómo se apoyan las reglas ya resueltas en este modelo:
- **Edición (D10) y cancelación (D11):** solo permitidas mientras **ningún** "Destinatario del mensaje" tenga estado de lectura distinto de `Nuevo`.
- **Eliminación (D02):** el Mensaje pasa a estado `Eliminado`; cada destinatario recibe el aviso "Este mensaje fue eliminado por el remitente"; el contenido puede conservarse internamente para evidencia/auditoría.
- **Adjuntos (D03/D17):** entidades propias asociadas al Mensaje, delegando el almacenamiento físico al módulo `archivos`.

Nada de esto define tablas, claves foráneas ni un motor de persistencia.

### K. Autorización

**Frontend:** `authGuard` (sesión activa) y `adminGuard` (rol Administrador) protegen rutas evaluando el `CurrentUser` que expone `auth.service`, sin depender de qué mecanismo concreto llene ese `CurrentUser` (implementación provisional de desarrollo hoy, mecanismo definitivo después). Adicionalmente se ocultan en la UI las acciones no permitidas — pero eso es solo UX, no la protección real.

**Backend:** cada `Controller` declara explícitamente su nivel de exigencia (`AuthGuard` para cualquier sesión válida; `AuthGuard + RolesGuard @Roles('Administrador')` para lo exclusivo de Administrador) — corrigiendo el hallazgo de que hoy **ningún** endpoint está protegido. Se protegen desde el diseño: dentro de `usuarios`, la consulta/directorio de personas (necesaria para seleccionar destinatarios) queda abierta a cualquier sesión autenticada, mientras que la creación, edición, activación/desactivación y reset administrativo de contraseña quedan exclusivamente para Administrador; el módulo `auditoria` completo es exclusivo de Administrador; y las mutaciones de `formatos` serán exclusivas de Administrador si se aprueba su administración (D04).

### L. Transversales

| Aspecto | Dónde vive | Nota |
|---|---|---|
| Notificaciones | `core/notifications` + `shared/toast-container` | Corrige el hallazgo de V1: agregar `aria-live="polite"` y cierre manual |
| Confirmaciones | `core/dialogs` + `shared/confirm-dialog` | Unifica los dos patrones inconsistentes de V1 (ver también Parte III §5, aprobado) |
| Errores HTTP | `core/http/api-error.interceptor.ts` | Centraliza la detección de "sin conexión" (`status === 0`) y el formateo de errores de validación |
| Loading | Estado local por acción en cada página, como en V1 | No requiere infraestructura transversal adicional |
| Accesibilidad y foco | Utilidad/directiva reutilizable en `core/a11y` | Formaliza `guardarFoco`/`restaurarFoco` y añade focus trap real + Escape unificado |
| Responsive | Variables SCSS compartidas | Conserva los breakpoints ya validados de V1 (1100/820/768/640/480/360px) |
| Configuración/environments | `environment.ts`/`.env` | Se mantiene el patrón ya existente, ampliado según se necesite |

### M. Testing — estrategia proporcional (vigente, sin cambios)

- **Backend (mayor prioridad):** unitarios de `Service` por módulo, con foco en las reglas de mayor riesgo — edición/cancelación condicionada a "nadie ha visto" (D10/D11), cálculo de estado por destinatario (D13), y los `Guards` de autorización.
- **Frontend — unitarios:** de servicios (mapeo de respuestas HTTP) y de la lógica no trivial de componentes complejos. No unitarios masivos de componentes puramente de presentación.
- **Integración:** flujos críticos contra el backend real — login → enviar mensaje → verlo como destinatario → responder; crear usuario → login; eliminar mensaje → verificar que todos los destinatarios dejan de verlo.
- **E2E:** solo los flujos más representativos — login, enviar mensaje, marcarlo visto, activar/desactivar usuario, uso básico del calendario.

No se proponen pruebas exhaustivas por defecto de pantallas sin lógica propia.

### Decisiones arquitectónicas justificadas (resumen)

- Frontend por `features/` + `core/` + `shared/`, no un monolito ni una carpeta por tipo de archivo.
- `frontend/` explícito junto a `backend/` — simetría estructural.
- Calendario como ruta propia (`/calendario`) en vez de modal global.
- Sin librería de estado — el estado compartido real es pequeño.
- `auth` como módulo desacoplado, en frontend y backend — único punto donde se sabe que la implementación cambiará (D08).
- Persistencia detrás del `Service` de cada módulo, sin capa `Repository` genérica todavía.
- Mensaje y "Destinatario del mensaje" como conceptos separados — única forma de cumplir D13 sin inventar estructura física.
- Autorización declarada en cada endpoint desde el día uno.
- Auditoría como módulo transversal simple (servicio inyectado), no un bus de eventos.

### Alternativas descartadas y por qué

| Alternativa | Se descartó porque… |
|---|---|
| Monorepo con Nx/Turborepo/pnpm workspaces | Solo dos apps, comunicadas por HTTP — complejidad sin beneficio medible. |
| NgRx / librería de estado dedicada | El estado compartido real es pequeño; no hay necesidad de time-travel debugging. |
| Patrón `Repository` genérico desacoplado del ORM, definido ya | Abstraer sobre un esquema y motor de persistencia todavía desconocidos sería una interfaz especulativa. |
| Microservicios / separación por múltiples APIs | El tamaño funcional del sistema no justifica la complejidad operativa. |
| Calendario como modal global (igual que V1) | Se prefirió ruta propia por aprovechar mejor Angular Router. |
| Bus de eventos interno para Auditoría | El volumen de eventos de este sistema no lo justifica. |

### Riesgos identificados en esta fase

- Autenticación provisional prolongada si D08 se sigue difiriendo más allá de la reconstrucción estructural.
- Rediseño de persistencia al conocer el esquema institucional real.
- Scope creep: tentación de "mejorar" funcionalidades no aprobadas explícitamente.
- Deuda de accesibilidad heredada si los huecos conocidos no se priorizan explícitamente.

---

## PARTE III — Arquitectura final revisada (VIGENTE — sustituye a la Parte II donde corresponde)

La arquitectura de la Parte II quedó **aprobada con ajustes**. Esta parte incorpora los cambios obligatorios aprobados y es la versión que debe seguirse en la implementación.

> **Nota de alcance (ETAPA 14B):** las referencias a `calendario/` y `recordatorios/` en esta Parte III (árbol de módulos, rutas, mapa de features, tabla de servicios, orden de construcción) describían un módulo previsto en el diseño original. El responsable del proyecto confirmó posteriormente que Calendario y Recordatorios no pertenecían al sistema real usado como referencia funcional y quedan **FUERA DE ALCANCE ACTUAL** — no deben implementarse. Se conservan anotadas en el lugar donde aparecían, en vez de eliminarse, para no perder la evidencia de la decisión arquitectónica original. Ver también `docs/decisiones-funcionales-v2.md` (D18) y `docs/inventario-funcional-v1.md`.

### 1. Árbol final del repositorio

```
SIIntranetV2/
├── frontend/        # proyecto Angular NUEVO — se genera vacío, no se migra V1
├── backend/         # proyecto NestJS NUEVO — se genera vacío, no se evoluciona el V1 in-place
├── docs/
│   ├── inventario-funcional-v1.md
│   ├── decisiones-funcionales-v2.md
│   └── arquitectura-v2.md
├── .editorconfig
├── .gitignore
├── CLAUDE.md
└── README.md
```

### 2. Árbol final frontend

```
frontend/
└── src/
    ├── app/
    │   ├── app.ts                        # shell raíz: <router-outlet>
    │   ├── app.config.ts
    │   ├── app.routes.ts
    │   │
    │   ├── core/                         # infraestructura transversal, sin UI de dominio propia
    │   │   ├── auth/
    │   │   │   ├── auth.service.ts       # implementación provisional — sin admin/123 ni texto plano (D08 diferida)
    │   │   │   ├── auth.guard.ts
    │   │   │   └── admin.guard.ts
    │   │   ├── http/
    │   │   │   ├── api-error.interceptor.ts
    │   │   │   └── api.config.ts
    │   │   ├── notifications/
    │   │   │   └── notification.service.ts
    │   │   ├── dialogs/
    │   │   │   └── confirm-dialog.service.ts
    │   │   ├── files/                                    # subida/descarga real; consumido por mensajería y, a futuro, formatos
    │   │   │   ├── archivos.service.ts
    │   │   │   └── models/adjunto.model.ts
    │   │   └── models/current-user.model.ts
    │   │
    │   ├── layout/
    │   │   ├── app-shell/
    │   │   ├── navbar/
    │   │   └── footer/
    │   │
    │   ├── shared/                       # UI reutilizable sin dueño de dominio
    │   │   ├── components/
    │   │   │   ├── confirm-dialog/                       # ejemplo de convención de archivos separados
    │   │   │   │   ├── confirm-dialog.ts
    │   │   │   │   ├── confirm-dialog.html
    │   │   │   │   ├── confirm-dialog.scss
    │   │   │   │   └── confirm-dialog.spec.ts
    │   │   │   ├── toast-container/
    │   │   │   │   ├── toast-container.ts
    │   │   │   │   ├── toast-container.html
    │   │   │   │   └── toast-container.scss
    │   │   │   ├── empty-state/
    │   │   │   └── loading-spinner/
    │   │   └── pipes/
    │   │       └── fecha-hora.pipe.ts
    │   │
    │   └── features/
    │       ├── auth/
    │       │   └── pages/login-page/
    │       │       ├── login-page.ts
    │       │       ├── login-page.html
    │       │       └── login-page.scss
    │       │
    │       ├── inicio/
    │       │   └── pages/inicio-page/
    │       │
    │       ├── usuarios/                                 # dominio "persona": consulta + administración, único servicio
    │       │   ├── services/usuarios.service.ts
    │       │   └── models/usuario.model.ts
    │       │
    │       ├── mensajeria/
    │       │   ├── pages/
    │       │   │   ├── mensaje-nuevo-page/                 # SOLO redactar/editar/responder
    │       │   │   │   ├── mensaje-nuevo-page.ts
    │       │   │   │   ├── mensaje-nuevo-page.html
    │       │   │   │   └── mensaje-nuevo-page.scss
    │       │   │   ├── bandeja-page/
    │       │   │   │   ├── bandeja-page.ts
    │       │   │   │   ├── bandeja-page.html
    │       │   │   │   └── bandeja-page.scss
    │       │   │   └── enviados-page/                      # separada de mensaje-nuevo-page
    │       │   │       ├── enviados-page.ts
    │       │   │       ├── enviados-page.html
    │       │   │       └── enviados-page.scss
    │       │   ├── components/
    │       │   │   ├── mensaje-form/
    │       │   │   ├── destinatarios-selector/             # consume features/usuarios, NO features/administracion
    │       │   │   │   ├── destinatarios-selector.ts
    │       │   │   │   ├── destinatarios-selector.html
    │       │   │   │   ├── destinatarios-selector.scss
    │       │   │   │   └── destinatarios-selector.spec.ts
    │       │   │   ├── mensaje-list-item/                   # compartido entre bandeja-page y enviados-page
    │       │   │   ├── mensaje-detalle-modal/               # compartido entre bandeja/enviados/calendario
    │       │   │   └── estado-badge/
    │       │   ├── services/mensajes.service.ts
    │       │   └── models/
    │       │       ├── mensaje.model.ts
    │       │       └── mensaje-destinatario.model.ts
    │       │
    │       ├── calendario/                                    # FUERA DE ALCANCE ACTUAL — ver nota de alcance ETAPA 14B
    │       │   ├── pages/calendario-page/                   # ruta real `/calendario`, no modal global
    │       │   ├── components/calendario-grid/, evento-item/
    │       │   └── services/recordatorios.service.ts
    │       │
    │       ├── formatos/
    │       │   ├── pages/formatos-page/
    │       │   ├── components/formato-categoria/
    │       │   └── services/formatos.service.ts
    │       │
    │       ├── perfil/
    │       │   └── components/perfil-modal/
    │       │
    │       ├── administracion/                              # SOLO UI administrativa — consume features/usuarios
    │       │   ├── pages/usuarios-page/
    │       │   └── components/usuario-form-modal/, usuario-detalle-modal/
    │       │
    │       └── auditoria/
    │           ├── pages/auditoria-page/
    │           └── services/auditoria.service.ts
    │
    ├── environments/
    └── main.ts
```

**No hay `features/archivos`:** no existe una pantalla ni un flujo propio de "gestión de archivos" en el inventario funcional — los archivos siempre son adjuntos de un Mensaje o (a futuro) de un Formato. `archivos.service` vive en `core/files` por ser infraestructura transversal usada por dos dominios distintos, no por tener pantalla propia.

### 3. Árbol final backend

```
backend/
└── src/
    ├── app.module.ts
    ├── main.ts
    ├── common/
    │   ├── interfaces/
    │   └── decorators/roles.decorator.ts
    └── modules/
        ├── auth/           # auth.controller.ts, auth.service.ts, guards/, dto/
        ├── usuarios/       # lectura (cualquier sesión) + administración (Administrador)
        ├── mensajes/       # modelo Mensaje + Destinatario individual
        ├── recordatorios/  # FUERA DE ALCANCE ACTUAL — ver nota de alcance ETAPA 14B
        ├── formatos/
        ├── archivos/       # subida/almacenamiento/descarga reales
        ├── auditoria/
        └── health/
```

### 4. Rutas finales

```
/login                          pública (redirige a /inicio si ya hay sesión)
/                                redirect → /inicio
/inicio                          authGuard
/mensajes/nuevo                  authGuard   — redactar / editar / responder (según origen de navegación)
/mensajes/bandeja                authGuard
/mensajes/enviados               authGuard
/calendario                      FUERA DE ALCANCE ACTUAL — ver nota de alcance ETAPA 14B (no implementar)
/formatos                        authGuard
/administracion/usuarios         authGuard + adminGuard
/administracion/auditoria        authGuard + adminGuard
**                               redirect → /inicio
```

**Navegación editar/responder:** `mensaje-nuevo-page` necesita saber "para qué" se abrió y "a dónde volver". Se resuelve con parámetros de ruta o router state (p. ej. `/mensajes/nuevo?editando=123` vuelve a `/mensajes/enviados`; `/mensajes/nuevo?respondiendo=123` vuelve a `/mensajes/bandeja`). Sustituye a `moduloPrevioAEdicion` de V1, expresado como navegación real de Angular Router.

### 5. Mapa de features

| Feature | Dueño de | Depende de (features) |
|---|---|---|
| `auth` | Sesión, login/logout, cambio obligatorio | — |
| `inicio` | Dashboard | `mensajeria` (dependencia de `calendario` sin efecto: FUERA DE ALCANCE ACTUAL, ver nota 14B) |
| `usuarios` | Dominio "persona del sistema": consulta + administración | — |
| `mensajeria` | Mensaje nuevo, bandeja, enviados, detalle | `usuarios` (destinatarios) |
| `calendario` | **FUERA DE ALCANCE ACTUAL** (ver nota de alcance, ETAPA 14B) — Calendario + recordatorios | `mensajeria` (eventos combinados) |
| `formatos` | Repositorio de documentos institucionales | — |
| `perfil` | Modal de datos de sesión | `auth` |
| `administracion` | UI administrativa de usuarios | `usuarios` |
| `auditoria` | Consulta de registro de auditoría | — |

**Regla explícita:** por defecto, ninguna feature depende de otra directamente — la comunicación cruzada pasa por `core`/`shared`. La única excepción es `usuarios`, tratada como **dominio fundacional** (igual que en el backend, donde `mensajes` depende de `usuarios`): tanto `mensajeria` como `administracion` consumen `features/usuarios` directamente. `calendario` depende de `mensajeria` únicamente para leer eventos (sin efecto actual: `calendario` está FUERA DE ALCANCE, ver nota 14B). Ninguna otra dependencia feature→feature está permitida.

### 6. Servicios y dependencias corregidos

| Servicio | Ubicación | Responsabilidad | NO debería hacer |
|---|---|---|---|
| `usuarios.service` | `features/usuarios` | Consulta de personas disponibles (cualquier sesión) **y** operaciones administrativas (protegidas por backend + `adminGuard`) | Decidir permisos por sí mismo; vivir dentro de `administracion` |
| `mensajes.service` | `features/mensajeria` | CRUD, estados por destinatario, transiciones | Formatear fechas; decidir a qué ruta volver |
| `recordatorios.service` | `features/calendario` | **FUERA DE ALCANCE ACTUAL** (ver nota de alcance, ETAPA 14B) — CRUD de recordatorios | Calcular eventos combinados (eso es de `calendario-page`) |
| `formatos.service` | `features/formatos` | Listado (y a futuro CRUD si D04) | Gestionar subida física (delega en `core/files`) |
| `auditoria.service` | `features/auditoria` | Consulta de registros | Registrar auditoría del lado del cliente |
| `archivos.service` | `core/files` | Subida y descarga real de archivos, genérico | Conocer reglas de negocio de mensajería o formatos |
| `auth.service` | `core/auth` | Sesión actual, login/logout, cambio obligatorio | Conocer otros dominios |
| `notification.service` / `confirm-dialog.service` | `core/notifications` / `core/dialogs` | Estado global de toasts / diálogo único | Contener lógica de negocio de la acción |

### 7. Estrategia final para crear V2 realmente desde cero

V1 permanece intacta en esta rama únicamente como referencia de lectura — y ya está preservada en `main` y en una copia local aparte.

1. **Preservación:** V1 se usa exclusivamente como especificación de comportamiento y como referencia puntual de código — nunca como base a mover, refactorizar o evolucionar in-place.
2. **Retiro deliberado** (cuando el plan de implementación final quede aprobado): se elimina la implementación legacy de la rama `reconstruccion/siintranet-v2`.
3. **Generación de proyectos nuevos:** Angular nuevo y vacío en `frontend/`, NestJS nuevo y vacío en `backend/` — sin archivos heredados de V1.
4. **Construcción desde cero:** cada funcionalidad se construye siguiendo esta arquitectura y el inventario funcional como especificación de comportamiento a igualar — no como código a portar.
5. **Consulta puntual, no reutilización:** se permite abrir fragmentos de V1 para resolver dudas concretas, nunca copiar/refactorizar archivos completos.
6. **Corte único, no migración incremental conviviendo en la misma rama:** el retiro ocurre antes de empezar a construir, no al final.

### 8. Orden de construcción

0. (Prerrequisito) Aprobación del plan de implementación → retiro deliberado de la implementación legacy.
1. Generar `frontend/` y `backend/` vacíos.
2. **Cimiento de acceso:** `core/auth` (provisional, sin credenciales hardcodeadas ni texto plano), `layout/app-shell`, esqueleto de rutas, `login-page`.
3. **Backend base + dominio de usuarios:** módulo `usuarios` con sus dos niveles de autorización, primer enganche de `auditoria`.
4. **Frontend — dominio de usuarios:** `features/usuarios` y `features/administracion` consumiéndolo.
5. **Infraestructura mínima de archivos** (`core/files`, subida/descarga/validación) — **antes** de Mensajería completa, para no dejarla incompleta y tener que modificarla después.
6. **Mensajería completa**, incluidos adjuntos reales: backend `mensajes` con modelo Mensaje/Destinatario, luego `mensaje-nuevo-page`, `bandeja-page`, `enviados-page` y componentes compartidos.
7. ~~Calendario y recordatorios, reutilizando `mensajes.service`.~~ **FUERA DE ALCANCE ACTUAL** (ver nota de alcance, ETAPA 14B) — no se ejecuta este paso; se conserva el número original para no renumerar el resto de la lista.
8. **Formatos** — consulta/descarga (paridad funcional con la referencia real; ver nota de alcance Formatos, ETAPA 14B — sin administración visual).
9. **Auditoría — página de consulta.**
10. **Accesibilidad, responsive y testing continuos** en todas las fases anteriores, más una pasada formal de cierre por feature.

### 9. Riesgos nuevos causados por los ajustes finales

- Mayor esfuerzo de reconstrucción al no reutilizar ni migrar código de V1.
- Pérdida de comparación en vivo dentro de la misma rama (mitigado: V1 sigue en `main` y copia local).
- Primera dependencia feature→feature explícita del diseño (`usuarios` como fundacional) — debe documentarse y respetarse para no abrir más dependencias cruzadas ad-hoc.
- Navegación editar/responder más compleja que en V1 al separar Enviados de Mensaje Nuevo.
- Percepción de UX más lenta al unificar las confirmaciones de eliminación (se pierde el atajo de doble-clic de V1).

---

**Nota final:** esta arquitectura no contiene código, no define tablas de base de datos, no elige ORM ni tecnología de autenticación definitiva. El plan operativo de corte (retiro de V1, generación de proyectos nuevos, comandos exactos de `ng new`/`nest new`, estrategia de commits) es un documento operativo separado, todavía pendiente de ejecución por etapas controladas.

> Fuente: diseño arquitectónico elaborado a partir de `docs/inventario-funcional-v1.md` y `docs/decisiones-funcionales-v2.md`.
