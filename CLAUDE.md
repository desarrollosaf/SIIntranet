# SIIntranet — Reconstrucción V2

## Propósito de esta rama

La rama `reconstruccion/siintranet-v2` contiene la reconstrucción de SIIntranet sobre una arquitectura nueva de frontend (Angular) y backend (NestJS), construida desde cero a partir del comportamiento funcional de la versión anterior del sistema.

La arquitectura, organización de carpetas, servicios, componentes, estado, routing, frontend y backend de esta reconstrucción son los que se documentan en [`docs/arquitectura-v2.md`](docs/arquitectura-v2.md) — no los de la versión anterior.

## Estado actual

La fase de análisis y diseño concluyó. La implementación está en curso sobre la arquitectura aprobada, siguiendo el orden de construcción descrito en `docs/arquitectura-v2.md`.

Módulos implementados y probados de extremo a extremo: Inicio, Mensajería (redacción, bandeja, detalle, respuesta, edición, cancelación, eliminación, adjuntos reales), Formatos (consulta y descarga) y Administración de usuarios (búsqueda/filtros, edición, activación/desactivación, reglas de integridad de Administradores). El alta de usuarios (creación de cuentas) no está implementada todavía — es un requisito contemplado en D05, pendiente de construcción, no una decisión sin resolver.

Calendario/recordatorios están **fuera del alcance actual** (decisión confirmada, no debe implementarse). Administración visual de Formatos sigue como decisión pendiente. Un módulo de auditoría está aprobado en `docs/decisiones-funcionales-v2.md` (D14) pero todavía no construido — es un paso de construcción pendiente, no un punto descartado. Ver ese documento para el detalle de cada decisión.

Pendientes de decisión institucional antes de un despliegue productivo: integración con la base de datos MySQL institucional (los datos de Usuarios, Mensajes, Formatos y la metadata de Archivos persisten en memoria del proceso backend; los binarios de archivos adjuntos ya se escriben en disco local, `backend/storage/archivos/`, sin ser una estrategia de persistencia definitiva) y el mecanismo de autenticación definitivo (la sesión actual es una identidad de desarrollo provisional, exclusiva de entornos con `AUTH_MODE=development`).

Mientras estas decisiones sigan pendientes:

- no reutilizar credenciales hardcodeadas, contraseñas en texto plano ni mecanismos de autenticación mock como si fueran definitivos;
- no seleccionar ORM, driver ni estrategia de migraciones sin análisis y aprobación explícita;
- no dar por definitiva ninguna decisión marcada como PENDIENTE o DIFERIDA en `docs/decisiones-funcionales-v2.md`.

## Relación con SIIntranet V1

La versión anterior del sistema ya no está presente en el código de esta rama. Su comportamiento, reglas de negocio y aprendizajes de UX quedaron documentados como especificación funcional en [`docs/inventario-funcional-v1.md`](docs/inventario-funcional-v1.md) antes de su retiro, y ese documento es la referencia a consultar — no debe reconstruirse ni copiarse su código.

La paridad buscada respecto a la versión anterior es funcional, no estructural: la arquitectura, estructura de carpetas y patrones de esta reconstrucción son los definidos en `docs/arquitectura-v2.md`, no los heredados.

## Arquitectura vigente

La arquitectura de referencia para cualquier cambio de código está en [`docs/arquitectura-v2.md`](docs/arquitectura-v2.md) (Parte III — Arquitectura final revisada). Cubre organización de repositorio, frontend (Angular por `core/`/`shared`/`features/`), backend (NestJS por módulos de dominio), routing, servicios, autorización, y la estrategia de persistencia detrás de cada `Service` de dominio.

Cada decisión arquitectónica relevante debe ser consistente con ese documento. Un cambio de arquitectura (no una funcionalidad puntual) debe reflejarse primero ahí.

## Base de datos

Los datos de Usuarios, Mensajes, Formatos y la metadata de Archivos persisten en memoria del proceso backend (se pierden al reiniciar), como implementación provisional documentada en `docs/decisiones-funcionales-v2.md` (D05). Los binarios de los archivos adjuntos (mensajes y formatos) ya se escriben en disco local del servidor (`backend/storage/archivos/`, ver D03/D17) — es almacenamiento de archivos ya aprobado, no una base de datos ni una estrategia de persistencia definitiva para datos estructurados.

No seleccionar ORM, driver ni estrategia de migraciones, ni introducir una base de datos, sin análisis y aprobación explícita.

## Autenticación y seguridad

La sesión actual es una identidad de desarrollo provisional (middleware activo solo con `NODE_ENV=development` y `AUTH_MODE=development`, que fija el usuario autenticado según la variable de entorno `DEV_USER_ID` del servidor) — no hay login real, contraseñas ni tokens todavía (D08, diferida).

La autorización por rol (`Administrador`/`Usuario`) sí es real: cada endpoint del backend declara explícitamente su nivel de exigencia mediante guards, independientemente del mecanismo de autenticación activo.

No reutilizar credenciales hardcodeadas, contraseñas en texto plano ni mecanismos mock como si fueran la implementación definitiva. La estrategia definitiva de autenticación, contraseñas y sesiones/tokens debe diseñarse explícitamente antes de reemplazar la identidad de desarrollo. Si una decisión depende de información que todavía debe proporcionar el administrador o supervisor, marcarla como decisión pendiente en `docs/decisiones-funcionales-v2.md` en lugar de inventarla.

## UX, responsive y accesibilidad

Cada pantalla y componente nuevo debe considerar desde su implementación: escritorio, tablet y móvil; navegación por teclado; estados `hover`, `active`, `focus-visible`, `disabled` y seleccionado; restauración de foco; Escape y backdrop en diálogos; áreas táctiles; layouts sin overflow accidental; estados vacíos, de carga y de error.

No posponer responsive ni accesibilidad a una etapa posterior de una funcionalidad.

## Testing

Cada nueva funcionalidad debe incluir pruebas según su responsabilidad: unitarias de servicio/lógica de componente en frontend, unitarias de `Service` y `Guard` en backend, y end-to-end contra el backend real para los flujos multiusuario que dependen de guards y controllers actuando juntos.

No construir una funcionalidad completa para agregar pruebas al final.

## Política de cambios

Antes de modificar código:

1. inspeccionar el estado actual de los archivos, servicios y pruebas relacionados con la tarea;
2. verificar el estado de Git;
3. identificar la causa del problema o el punto de extensión correcto antes de implementar;
4. preferir cambios pequeños, localizados y fáciles de revisar, acotados al alcance solicitado.

No ampliar el alcance de una tarea por iniciativa propia. No hacer refactors grandes como efecto colateral de un cambio puntual. No corregir hallazgos adicionales detectados durante una tarea sin reportarlos por separado primero.

## Git

Antes de cualquier modificación:

```bash
git branch --show-current
git status --short
```

La rama esperada para esta reconstrucción es:

`reconstruccion/siintranet-v2`

No cambiar de rama por iniciativa propia.

No hacer `git add`, commit, push, merge, rebase, reset destructivo ni reescritura de historial salvo solicitud explícita.

Preservar cualquier cambio local existente.

## Principio general

SIIntranet V2 se construye utilizando el comportamiento funcional validado de la versión anterior como especificación, sobre una arquitectura nueva — sin heredar su deuda técnica ni sus fallas de seguridad conocidas.
