# SIIntranet — Reconstrucción V2

## Propósito de esta rama

La rama `reconstruccion/siintranet-v2` contiene la reconstrucción completa de SIIntranet desde cero.

El código heredado presente actualmente en esta rama proviene de SIIntranet V1 y existe únicamente como referencia funcional temporal durante la fase de análisis.

La nueva aplicación debe diseñarse y construirse desde una arquitectura nueva.

No asumir que la arquitectura, organización de carpetas, servicios, componentes, estado, routing, frontend o backend actuales deben conservarse.

---

## Estado actual

Estamos en FASE 0: análisis y diseño.

Todavía NO se ha aprobado la arquitectura definitiva de V2.

Mientras esta fase siga vigente:

- no eliminar la implementación heredada;
- no crear todavía un proyecto Angular nuevo;
- no crear todavía un proyecto NestJS nuevo;
- no instalar dependencias;
- no modificar `package.json`;
- no generar componentes;
- no implementar funcionalidades;
- no refactorizar V1;
- no corregir bugs de V1;
- no hacer cambios de producción.

La tarea actual es comprender el sistema existente como especificación funcional y diseñar correctamente el nuevo sistema antes de escribir código.

---

## Relación con SIIntranet V1

V1 debe utilizarse únicamente para descubrir:

- funcionalidades existentes;
- flujos de usuario;
- campos;
- roles;
- módulos;
- reglas de negocio;
- comportamiento esperado;
- estados;
- validaciones;
- llamadas requeridas;
- experiencia visual;
- responsive;
- accesibilidad;
- errores y decisiones que no deben repetirse.

No copiar automáticamente:

- arquitectura;
- estructura de carpetas;
- `app.ts`;
- `app.html`;
- `app.scss`;
- navegación basada en condicionales;
- servicios actuales;
- backend actual;
- mocks;
- código HTTP;
- estado global;
- estilos;
- hacks o workarounds.

La paridad buscada es funcional, no estructural.

---

## Objetivo arquitectónico

La nueva versión debe diseñarse con separación clara de responsabilidades.

Como mínimo deben estudiarse explícitamente antes de implementar:

- dominios funcionales;
- frontend;
- backend;
- routing;
- componentes y páginas;
- servicios;
- modelos;
- DTOs;
- estado;
- configuración y environments;
- autenticación;
- autorización y roles;
- base de datos;
- contrato API;
- manejo de archivos;
- manejo de errores;
- notificaciones;
- modales y confirmaciones;
- accesibilidad;
- responsive;
- testing;
- seguridad;
- configuración para desarrollo y producción.

No adoptar una tecnología o patrón adicional únicamente porque sea popular.

Cada decisión arquitectónica importante debe justificarse en función de SIIntranet.

---

## Frontend V2

El frontend debe diseñarse desde cero.

Se espera utilizar Angular con una arquitectura por responsabilidades y funcionalidades, no un componente raíz monolítico.

Las pantallas o responsabilidades principales deben evaluarse como páginas/componentes independientes.

Los componentes visuales significativos deben mantener separación de archivos:

- `*.component.ts`
- `*.component.html`
- `*.component.scss`

No interpretar esto como “crear un componente por cada if”.

Crear componentes cuando exista una responsabilidad funcional, visual o reutilizable suficientemente clara.

Angular Router debe evaluarse como mecanismo principal de navegación.

Las llamadas HTTP no deben quedar dispersas dentro de componentes si pertenecen a servicios de dominio.

Los servicios deben organizarse según responsabilidades o dominios, evitando tanto un servicio gigante como un servicio artificial por cada componente.

---

## Backend V2

El backend también se reconstruirá desde cero.

NestJS puede evaluarse nuevamente como tecnología objetivo, pero no reutilizar automáticamente la implementación actual.

Antes de implementarlo deben definirse:

- dominios;
- módulos;
- endpoints;
- DTOs;
- entidades;
- persistencia;
- autenticación;
- autorización;
- archivos;
- validación;
- errores;
- configuración;
- seguridad;
- testing.

No utilizar almacenamiento temporal en memoria como arquitectura definitiva.

---

## Base de datos

La integración de base de datos debe diseñarse antes de implementar funcionalidades que dependan de persistencia.

No seleccionar ORM, driver o estrategia de migraciones sin análisis y aprobación.

El modelo de datos debe derivarse de los requisitos funcionales y reglas de negocio.

---

## Autenticación y seguridad

La autenticación de V1 es solamente una referencia funcional.

No reutilizar credenciales hardcodeadas, contraseñas en texto plano ni mecanismos mock.

La estrategia definitiva de autenticación, contraseñas, sesiones/tokens, roles y autorización debe diseñarse explícitamente antes de implementarse.

Si una decisión depende de información que todavía debe proporcionar el administrador o supervisor, marcarla como decisión pendiente en lugar de inventarla.

---

## UX, responsive y accesibilidad

V1 contiene aprendizajes importantes que deben convertirse en requisitos de V2.

La nueva aplicación debe considerar desde el inicio:

- escritorio;
- tablet;
- móvil;
- 320 px cuando aplique;
- navegación por teclado;
- estados `hover`, `active`, `focus-visible`, `disabled` y seleccionado;
- restauración de foco;
- focus trapping en diálogos cuando corresponda;
- Escape y backdrop;
- áreas táctiles;
- layouts sin overflow accidental;
- estados vacíos;
- carga;
- errores;
- notificaciones.

No posponer responsive o accesibilidad hasta el final del proyecto.

---

## Testing

La estrategia de pruebas debe definirse antes de comenzar la implementación.

Cada nueva funcionalidad debe incluir las pruebas adecuadas según su responsabilidad.

No construir primero todo el sistema para agregar pruebas al final.

---

## Política de cambios durante FASE 0

Durante análisis y arquitectura:

1. inspeccionar V1;
2. documentar funcionalidad;
3. detectar reglas de negocio;
4. identificar decisiones pendientes;
5. proponer arquitectura;
6. comparar alternativas;
7. esperar aprobación antes de implementar.

No modificar la implementación heredada salvo solicitud explícita.

No borrar archivos todavía.

No crear código nuevo de aplicación todavía.

---

## Git

Antes de cualquier modificación:

```bash
git branch --show-current
git status --short