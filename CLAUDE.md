# SIIntranet — Guía para Claude Code

## Proyecto

SIIntranet contiene:

- Frontend: Angular 22 con componentes standalone, TypeScript, SCSS, Bootstrap 5 y Bootstrap Icons.
- Backend: NestJS 11 organizado por módulos de dominio.
- Tests frontend: Vitest.
- Tests backend: Jest.

Antes de trabajar, inspeccionar el código real y el estado de Git. No asumir que este documento sustituye al repositorio como fuente de verdad.

---

## Estado actual de arquitectura

### Frontend

El frontend está actualmente concentrado principalmente en:

- `src/app/app.ts`
- `src/app/app.html`
- `src/app/app.scss`

Son archivos grandes que contienen múltiples secciones funcionales y comparten estado y estilos.

`app.routes.ts` está configurado pero actualmente el sistema no utiliza Angular Router para navegar entre módulos; la navegación se gestiona mediante estado interno.

Consecuencias:

- localizar la sección exacta antes de editar;
- realizar cambios mínimos y localizados;
- no reescribir archivos completos;
- no introducir una separación arquitectónica grande dentro de un fix;
- si una tarea revela necesidad de modularización, reportarla como refactor independiente.

### Backend

El backend sigue estructura modular en:

`backend/src/modules/`

Dominios actuales incluyen:

- auth
- usuarios
- mensajes
- formatos
- recordatorios
- archivos
- health

Mantener esta estructura para cambios backend.

---

## Estado temporal del sistema

### Persistencia

Actualmente el backend utiliza almacenamiento temporal en memoria.

No existe todavía una integración definitiva con base de datos.

No introducir ORM, drivers, migraciones ni persistencia real salvo que la tarea lo solicite explícitamente.

Cuando comience la fase de integración de base de datos, actualizar esta sección.

### Autenticación

La autenticación actual es temporal/mock.

`backend/src/modules/auth/auth.service.ts` contiene comportamiento provisional, incluyendo credenciales de desarrollo.

No transformar esta autenticación, introducir JWT, hashing u otro sistema por iniciativa propia.

Cualquier cambio de autenticación debe ser una tarea explícita.

### Producción

`src/environments/environment.prod.ts` todavía requiere la URL definitiva del backend productivo.

No inventar ni sustituir esa URL sin información de despliegue confirmada.

---

## Comandos

### Frontend

Ejecutar desde la raíz del repositorio:

```bash
npm run build
npm test -- --watch=false
npm run start
```

### Backend

Ejecutar desde `backend/`:

```bash
npm run build
npm test
npm run test:e2e
npm run start:dev
```

Antes de utilizar `npm run lint`, comprobar si el script ejecuta correcciones automáticas.

No utilizar comandos con `--fix` como una validación puramente de lectura sin advertirlo.

---

## Validación después de cambios

### Si solo cambia frontend

Ejecutar:

```bash
npm run build
npm test -- --watch=false
git diff --check
git diff --stat
git status --short
```

### Si solo cambia backend

Ejecutar desde `backend/`:

```bash
npm run build
npm test
```

y posteriormente desde la raíz:

```bash
git diff --check
git diff --stat
git status --short
```

### Si el cambio afecta integración frontend/backend

Validar ambos lados.

No afirmar que una tarea está terminada únicamente porque compila.

---

## Git

Antes de modificar código:

```bash
git branch --show-current
git status --short
```

Reglas:

- trabajar sobre la rama actualmente seleccionada;
- no cambiar de rama por iniciativa propia;
- no asumir que ramas históricas siguen activas;
- no hacer merge, rebase, reset destructivo ni reescribir historial sin una tarea explícita;
- nunca utilizar `--force` o `--no-verify` como solución automática;
- preservar cambios locales existentes del usuario;
- si `git status --short` muestra cambios locales previos ajenos a la tarea, detenerse y reportarlos antes de editar;
- nunca descartar, restaurar, sobrescribir o incluir cambios previos del usuario sin autorización explícita.

---

## Dependencias

No instalar, actualizar ni eliminar dependencias como efecto secundario de otra tarea.

Si parece necesaria una dependencia nueva:

1. explicar por qué;
2. comprobar si puede resolverse con el stack existente;
3. tratar la instalación como decisión explícita.

No modificar `package.json`, archivos lock, `angular.json`, `tsconfig*` ni configuración de build como efecto secundario de un fix, salvo que la tarea lo requiera explícitamente.

---

## Archivos y datos sensibles

No exponer, imprimir, registrar ni incluir en respuestas secretos provenientes de:

- `.env`
- credenciales
- tokens
- claves
- configuraciones privadas

Utilizar `.env.example` para comprender la estructura esperada cuando sea suficiente.

Archivos especialmente delicados:

- `backend/src/modules/auth/auth.service.ts`
- `src/environments/environment.prod.ts`
- configuración de entorno y despliegue

---

## Política de cambios

Para fixes y mejoras pequeñas:

1. inspeccionar primero el código relevante;
2. identificar la causa;
3. modificar únicamente lo necesario;
4. evitar duplicación;
5. evitar `!important` nuevo salvo que la cascada lo exija;
6. no mezclar refactors no relacionados;
7. revisar el diff completo;
8. ejecutar las validaciones correspondientes.

Si durante una tarea se encuentra otro problema, reportarlo por separado en lugar de incorporarlo automáticamente.

---

## Frontend visual y responsive

SIIntranet tiene trabajo previo de responsive, accesibilidad y UX/UI.

Al modificar UI:

- comprobar escritorio;
- comprobar móvil, incluyendo 320 px cuando aplique;
- comprobar teclado y mouse cuando el elemento sea interactivo;
- conservar estados `hover`, `active`, `focus-visible`, `disabled` y seleccionado;
- evitar layout shift provocado por estados interactivos;
- no ocultar overflow globalmente para disimular un problema local.

---

## Tests

La cobertura actual no es suficiente para asumir ausencia de regresiones.

Frontend y especialmente backend requieren ampliar cobertura conforme se modifique lógica existente.

Cuando una tarea cambie comportamiento de negocio, agregar o actualizar pruebas relevantes cuando sea razonable dentro del alcance.

No realizar una campaña de tests o refactor general como efecto secundario de un fix pequeño.

---

## Fase actual

El proyecto se encuentra en estabilización previa a integración definitiva de base de datos y despliegue.

Mientras esta fase siga vigente:

- priorizar correcciones, UX/UI, accesibilidad, tests y estabilidad;
- no agregar funcionalidades nuevas por iniciativa propia;
- no iniciar refactors arquitectónicos amplios sin solicitud explícita.

---

## Principio general

Priorizar:

- cambios pequeños;
- comportamiento existente;
- mantenibilidad;
- accesibilidad;
- consistencia;
- facilidad de revisión y reversión.

No aprovechar una tarea puntual para rediseñar la arquitectura completa del proyecto.
