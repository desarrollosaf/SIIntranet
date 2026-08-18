# Inventario funcional exhaustivo — SIIntranet V1 (FASE 0, solo análisis)

## Contexto

Esta rama (`reconstruccion/siintranet-v2`) contiene el código de SIIntranet V1 como referencia funcional temporal. Antes de diseñar la arquitectura de V2 se pidió un inventario exhaustivo de QUÉ hace el sistema actual, sin proponer todavía estructura, componentes, servicios ni tecnología para V2.

**Verificación previa realizada:**
- Rama actual: `reconstruccion/siintranet-v2` ✅
- `git status --short`: sin salida → working tree limpio ✅
- No se modificó, creó ni eliminó ningún archivo durante este análisis.

**Alcance inspeccionado:** todo el frontend (`src/`, Angular 22 standalone, un único componente monolítico `App` de 2406 líneas + plantilla de 1559 líneas + 5827 líneas de SCSS), todo el backend (`backend/src/`, NestJS con 6 módulos en memoria), `app.spec.ts`, `environments/*`, `README.md` / `README_BACKEND.md`, `.env.example`, `package.json`.

Este documento **no es un plan de implementación**: es el entregable de investigación solicitado. No se propone ninguna arquitectura de V2 ni se ejecutará ningún cambio de código a partir de su aprobación.

**Clasificación usada:** A=Requisito funcional confirmado · B=Requisito UX/Accesibilidad · C=Comportamiento temporal/mock · D=Decisión de implementación de V1 · E=Bug/deuda técnica · F=Decisión pendiente/información insuficiente.

---

> **Nota posterior de alcance V2 (ETAPA 14B):** el código histórico auditado en este documento contiene Calendario y Recordatorios, pero el responsable del proyecto confirmó posteriormente que estas funciones no pertenecían al sistema real tomado como referencia funcional y que no forman parte del alcance actual de SIIntranet V2. No se espera información de Calendario/Recordatorios en la base de datos institucional. Las menciones a Calendario/Recordatorios en las secciones siguientes se conservan íntegramente como evidencia del prototipo auditado, no como requisito funcional vigente para V2. Ver `docs/decisiones-funcionales-v2.md` (D18) y `docs/arquitectura-v2.md` para el estado reconciliado.

---

## 1. Resumen funcional del sistema

SIIntranet es una intranet institucional del Poder Legislativo del Estado de México con cuatro funciones centrales: mensajería interna (envío/recepción de "documentos" con adjuntos simulados), un calendario con recordatorios personales, un repositorio de formatos institucionales agrupados por área, y administración de usuarios (solo para el rol Administrador). Hoy es una SPA Angular de un solo componente raíz que consume una API REST NestJS cuyo almacenamiento es enteramente en memoria (sin base de datos) y cuya autenticación es un mock sin JWT ni cifrado de contraseñas.

## 2. Mapa de módulos

| Módulo (`moduloActual`) | Propósito | Acceso |
|---|---|---|
| `inicio` | Dashboard: mensajes recientes, enlaces externos, acceso al calendario | Todos |
| `mensaje` | Redactar/editar mensajes + listado de enviados | Todos |
| `bandeja` | Bandeja de entrada de mensajes recibidos | Todos |
| `formatos` | Repositorio de documentos institucionales por categoría (solo lectura) | Todos |
| `administracion` | Gestión de usuarios (alta, edición, activar/desactivar) | Solo Administrador |
| Login (fuera de `moduloActual`) | Autenticación | No autenticados |

No existe un módulo de "Archivos" real pese a que el backend define un módulo `archivos` — solo expone un endpoint `status` sin lógica, y el frontend nunca lo consume [C/D].

## 3. Actores y roles

Solo se detectan dos roles observables en la UI: **Administrador** y **Usuario** (`usuarioActual.tipo: 'admin' | 'normal'`, derivado de `rol === 'Administrador'`). El campo `rol` en el modelo de datos es un `string` libre tanto en frontend como backend (sin `enum`/`IsIn` en el backend); solo el `<select>` del formulario de administración limita las opciones a esas dos [D/F — decidir si el rol debe ser un catálogo fijo o configurable].

Diferencias observables entre roles:
- Solo Administrador ve y puede navegar al módulo "Administración" [A].
- La restricción de acceso a "Administración" se aplica **únicamente en el frontend** (redirección + notificación de error). El backend no tiene guards/autorización: cualquier cliente HTTP puede llamar `GET/POST/PATCH/DELETE /api/usuarios` sin restricción alguna [E — hallazgo de seguridad, no debe heredarse].
- No hay ningún otro permiso diferenciado (todos los usuarios activos pueden enviar mensajes, ver bandeja, ver formatos, usar el calendario).

## 4. Inventario completo de pantallas

**Pantallas de nivel superior:**
1. Login (pantalla completa fuera del layout autenticado).
2. Inicio — mensajes recientes (máx. 10), enlaces externos institucionales, tarjeta de acceso al calendario.
3. Mensaje nuevo — formulario de creación/edición + lista de mensajes enviados con buscador y filtro de estado.
4. Bandeja de entrada — lista de mensajes recibidos con buscador, filtro de estado y filtro de fecha.
5. Formatos — acordeón de 11 categorías institucionales fijas, cada una con sus documentos (solo lectura).
6. Administración — tabla de usuarios con buscador y filtros de rol/estado; solo Administrador.
7. Estado "Acceso Restringido" — se muestra si un no-admin llega a `administracion` (p. ej. editando el hash de la URL).

**Modales (7):**
1. Perfil de usuario — datos de sesión + varios campos marcados "Pendiente de vincular" (adscripción, puesto, correo institucional, número de empleado) que **nunca se implementaron** [C/F].
2. Calendario completo — navegación de mes, grid de días, buscador de fecha, filtro Todos/Mensajes/Recordatorios, lista de eventos del día, formulario de nuevo recordatorio.
3. Detalle de mensaje — info completa, adjuntos, acciones contextuales (editar/eliminar si es propio y editable; responder/eliminar si es recibido).
4. Ver usuario (admin) — detalle de solo lectura + acciones Editar / Descargar PDF / Cerrar.
5. Crear/Editar usuario (admin) — formulario completo, generación de contraseña aleatoria, checkbox "requiere cambio de contraseña".
6. Cambio de contraseña obligatorio — modal bloqueante (sin backdrop-click ni Escape), solo se sale completando el cambio o cerrando sesión.
7. Confirmación genérica reutilizable — título, mensaje con elemento destacado, tipo (danger/success/warning/primary), ícono, texto de botón y callback parametrizables.

**Estados especiales:** vacío (por lista: mensajes recientes, bandeja, enviados —2 variantes—, usuarios admin —2 variantes—, formatos por categoría, eventos del día); carga (spinners por acción: login, usuario, estado de usuario, mensaje, recordatorio); error de conexión (mensaje específico si `err.status === 0`, deduplicado a máx. 1 cada 5s).

## 5. Entidades y campos

**Usuario** (`Usuario` en backend, `UsuarioSistema` en frontend — duplicado casi idéntico):
`id, nombre, usuario (login), correo, area, rol, estado ('Activo'|'Inactivo'), password?, requiereCambioPassword?`. Frontend agrega además `passwordTemporal?` (campo muerto, ver §14) y `verContrasenaEdicionUsuario` (UI only).

**Mensaje**: `id, remitente, titulo, descripcion, fecha, hora, documento (string, nombres separados por coma), destinatarios (string, nombres separados por coma), estado ('Enviando'|'Nuevo'|'Visto'|'Respondido'|'Cancelado'|'Eliminado'|'Enviado'|'Pendiente'), tipoMensaje? ('recibido'|'enviado'), estadoLectura? ('Nuevo'|'Visto'), estadoRespuesta? ('Pendiente'|'Respondido')`. Frontend agrega `estadoTemporal?` (UI optimista) y `confirmarEliminarSent?` (UI only).

**Recordatorio**: `id, titulo, descripcion, fecha, hora, tipo ('recordatorio' fijo), estado ('Activo'|'Inactivo'|'Eliminado'), creadoPor`.

**Formato / DocumentoFormato**: `id, nombre, descripcion, categoria, archivo (nombre de archivo, string), tipoArchivo, fechaCreacion, estado ('Activo'|'Inactivo')`.

**EventoCalendario** — no es una entidad persistida, es un view-model calculado en el frontend combinando Mensajes + Recordatorios: `fecha, tipo, titulo, descripcion, hora?, estados?, esEnviado?, mensajeAsociado?`.

**ArchivoAdjunto** (`{ nombre, archivo }`) — interfaz definida en `common.interfaces.ts` pero **nunca usada** en ningún controller/service/DTO ni en el frontend [D — código muerto].

**LoginRequest / LoginResponse**: `LoginResponse.token` es siempre `null` (`mode: 'mock'`) — no hay sesión real del lado servidor [C].

## 6. Casos de uso por módulo

**Autenticación:** iniciar sesión; cerrar sesión; cambio de contraseña obligatorio en el primer/próximo login; persistencia de sesión en `sessionStorage` (se pierde al cerrar pestaña).

**Mensajería:** redactar mensaje (título, descripción, adjuntos, destinatarios múltiples vía lista dual); ver bandeja de recibidos con búsqueda/filtro por estado/fecha; ver enviados con búsqueda/filtro por estado; ver detalle; marcar como visto (automático al abrir detalle); responder (pre-carga destinatario = remitente original); editar mensaje propio (si el estado lo permite); eliminar (soft delete, con dos patrones de confirmación distintos — ver §14); cancelar envío mientras está en curso.

**Calendario:** navegar meses; buscar por fecha; seleccionar día; ver eventos combinados (mensajes + recordatorios) del día; filtrar por tipo; agregar recordatorio (máx. 150 caracteres); eliminar recordatorio (con confirmación); abrir el mensaje asociado a un evento desde el calendario.

**Formatos:** listar por categoría (acordeón); "descargar" (simulado, solo notificación — no hay archivo real).

**Administración de usuarios:** listar con búsqueda/filtro (rol, estado); ver detalle; crear; editar (todos los campos + contraseña + flag de cambio obligatorio); generar contraseña aleatoria; activar/desactivar (soft, con confirmación); descargar ficha PDF del usuario (vía ventana de impresión del navegador, no un PDF real generado en servidor).

**Perfil:** ver datos del usuario en sesión (mayormente placeholders "Pendiente de vincular"); cerrar sesión desde el modal de perfil.

## 7. Flujos principales

1. Login → detección de sesión guardada / hash de URL → Inicio (con modal bloqueante de cambio de contraseña si aplica).
2. Inicio → Mensaje nuevo → completar formulario → seleccionar destinatarios (transferencia dual-list) → adjuntar archivos → Enviar → notificación → recarga de enviados.
3. Bandeja → clic en mensaje → Detalle (marca "Visto" automáticamente) → Responder → formulario pre-cargado → Enviar.
4. Bandeja → Eliminar (modal de confirmación) → soft delete → desaparece salvo filtro "Papelera".
5. Enviados → clic en mensaje editable → Editar → Guardar (PATCH) → vuelve al módulo previo y reabre el detalle actualizado.
6. Enviados → Eliminar (doble clic de confirmación en la fila, expira a los 5s) → soft delete.
7. Inicio → Calendario → navegar/buscar fecha → agregar o eliminar recordatorio; clic en evento tipo mensaje abre su detalle (el modal de detalle se apila sobre el del calendario — comportamiento no verificado visualmente, ver §16).
8. Administración → Nuevo usuario → formulario → Crear → recarga de lista.
9. Administración → Ver usuario → Editar → guardar perfil (+ contraseña si se definió una nueva) → recarga de lista.
10. Administración → Activar/Desactivar (confirmación) → PATCH de estado.
11. Cerrar sesión → limpia todo el estado local y `sessionStorage` → vuelve a Login.

## 8. Reglas de negocio (A, salvo indicado)

- Solo Administrador accede al módulo de Administración.
- Usuario con `estado: 'Inactivo'` no puede iniciar sesión (rechazo explícito con mensaje).
- `requiereCambioPassword` fuerza un modal no cancelable (salvo cerrar sesión) antes de continuar.
- La contraseña nueva debe tener ≥8 caracteres y confirmarse — **regla aplicada solo en frontend**, el backend no la valida [A + F].
- Un mensaje es "enviado" o "recibido" según `tipoMensaje`, o por comparación de `remitente` contra el usuario actual si el campo falta.
- Estado de lectura (Nuevo/Visto) y de respuesta (Pendiente/Respondido) son independientes entre sí en mensajes recibidos.
- Ver el detalle de un mensaje recibido lo marca "Visto" automáticamente.
- Responder marca "Visto" + "Respondido" y pre-selecciona como destinatario al remitente original.
- Eliminar un mensaje es siempre soft delete (`estado: 'Eliminado'`); no existe restaurar ni purgar definitivamente [A + F pendiente].
- Solo se puede editar un mensaje enviado si su estado está en `{Enviado, Visto, Nuevo, Respondido}`.
- Solo se puede responder un mensaje si es recibido y no está en un estado temporal/Cancelado/Eliminado.
- Recordatorio: descripción obligatoria, máx. 150 caracteres — **regla solo en frontend**, sin réplica en el backend [A + F].
- Las 11 categorías de formatos son una lista fija hardcodeada en el frontend, no datos del backend.
- El contador de "visitas totales" se guarda en `localStorage` del navegador (por dispositivo, no por usuario ni servidor) [C].
- La sesión vive en `sessionStorage` sin expiración por tiempo ni token real [C].

## 9. CRUD por entidad

| Entidad | Create | Read | Update | Delete |
|---|---|---|---|---|
| Usuario | ✅ UI admin | ✅ lista (GET :id no se usa en UI) | ✅ perfil + contraseña (llamadas separadas) | Backend expone `DELETE` pero es soft (pone Inactivo) y **la UI nunca lo llama**; la UI usa PATCH de estado para activar/desactivar [D] |
| Mensaje | ✅ formulario | ✅ todos/recibidos/enviados (GET :id no se usa) | ✅ edición de contenido + transiciones de estado (visto/respondido) | ✅ soft delete, dos patrones de confirmación distintos |
| Formato | Backend ✅, **sin UI** | ✅ solo lectura (GET por categoría no se usa, filtro es client-side) | Backend ✅, **sin UI** | Backend ✅ (soft), **sin UI** |
| Recordatorio | ✅ desde calendario | ✅ (GET por fecha no se usa, filtro es client-side) | Backend ✅, **sin UI de edición** | ✅ soft delete con confirmación |
| Archivo | ❌ no implementado | Solo `status` | ❌ | ❌ |

## 10. API / endpoints actuales

Base: `http://localhost:3000/api` (CORS abierto solo a `FRONTEND_URL`, sin auth real).

| Método | Ruta | Consumido por frontend | Notas |
|---|---|---|---|
| GET | `/health` | No | — |
| GET | `/auth/status` | No | — |
| POST | `/auth/login` | `hacerLogin()` | Mock: compara texto plano o acepta `admin/123` hardcodeado [C] |
| GET | `/usuarios`, `/usuarios/status` | `cargarUsuarios()` (solo la primera) | — |
| GET | `/usuarios/:id` | No | — |
| POST | `/usuarios` | `guardarCambiosUsuarioAdmin()` (crear) | — |
| PATCH | `/usuarios/:id` | `guardarCambiosUsuarioAdmin()` (editar), `solicitarAlternarEstadoUsuario()` | — |
| PATCH | `/usuarios/:id/password` | `cambiarContrasenaObligatoria()`, `guardarCambiosUsuarioAdmin()` | Sin validación de longitud en backend |
| DELETE | `/usuarios/:id` | No | Muerto desde la UI |
| GET | `/mensajes`, `/mensajes/recibidos`, `/mensajes/enviados`, `/mensajes/status` | Sí (las 3 primeras) | — |
| GET | `/mensajes/:id` | No | — |
| POST | `/mensajes` | `enviarMensaje()` (crear) | — |
| PATCH | `/mensajes/:id` | `enviarMensaje()` (editar), `marcarComoVisto()`, `marcarComoRespondido()` | — |
| DELETE | `/mensajes/:id` | `eliminarMensaje()`, `eliminarMensajeEnviado()` | — |
| GET | `/formatos`, `/formatos/status` | Solo la primera | `formatos/categoria/:categoria` no se usa |
| POST/PATCH/DELETE | `/formatos*` | No | Completamente muertos desde la UI |
| GET | `/recordatorios`, `/recordatorios/status` | Solo la primera | `recordatorios/fecha/:fecha` no se usa |
| POST | `/recordatorios` | `agregarRecordatorioCalendario()` | — |
| PATCH | `/recordatorios/:id` | No | Muerto desde la UI |
| DELETE | `/recordatorios/:id` | `eliminarRecordatorioCalendario()` | — |
| GET | `/archivos/status` | No | Único endpoint del módulo |

**Endpoint referenciado por el frontend que NO existe en el backend:** el detalle de mensaje construye enlaces de descarga a `http://localhost:3000/api/mensajes/descargar/{doc}` (además hardcodea la URL en vez de usar `environment.apiUrl`) — esa ruta no está implementada en `MensajesController` [E — contradicción].

## 11. Validaciones

**Frontend** (imperativas en TS, no Reactive Forms): login (usuario y contraseña no vacíos); mensaje (título, descripción, ≥1 destinatario); recordatorio (descripción no vacía, ≤150 caracteres, hora requerida); usuario admin (nombre/usuario/área/rol no vacíos, correo con regex de formato, contraseña ≥8 si se define); cambio de contraseña obligatorio (≥8 caracteres, confirmación coincide).

**Backend** (`class-validator`, `ValidationPipe({whitelist:true})`): DTOs con `@IsString/@IsNotEmpty/@IsEmail/@IsIn/@IsOptional/@IsBoolean` por entidad (detalle en cada DTO leído). Contraste relevante: `ChangePasswordDto` no exige longitud mínima; `CreateRecordatorioDto` no exige máximo de 150 caracteres — ambas reglas existen solo del lado cliente [F — decidir si deben replicarse en el modelo definitivo].

## 12. UX, responsive y accesibilidad (B, salvo indicado)

- Breakpoints observados en SCSS: 1100px, 820px, 768px, 640px, 480px, 360px. No se encontró un breakpoint explícito de 320px [F — confirmar si es requisito].
- Uso extendido de `:focus-visible` en botones, enlaces, inputs, selects y elementos interactivos custom (tarjetas, filas de tabla, celdas de calendario).
- Guardado/restauración de foco (`guardarFoco`/`restaurarFoco`) al abrir/cerrar la mayoría de modales, con foco inicial dirigido al botón de cierre o primer campo (vía `setTimeout` de 50ms).
- Manejo centralizado de Escape (`manejarEscapeModales`) en orden de prioridad — **excepto** el modal de cambio de contraseña obligatorio (bloqueo intencional, A) y el modal de confirmación genérica (omitido, inconsistencia — E).
- Navegación por teclado tipo lista (flechas) en: mensajes recientes, bandeja, enviados, eventos de calendario, filas de usuarios, categorías de formatos; navegación de grid completo (4 direcciones + Enter/Espacio) en el calendario, saltando celdas vacías.
- Patrón deliberado `mousedown`+`mouseup` en backdrops (en vez de solo `click`) para evitar cierres accidentales al seleccionar texto arrastrando fuera del modal.
- El modal de edición de usuario **no** cierra al hacer click en el backdrop (evita pérdida de datos); en su lugar, al intentar cerrarlo por botón/cancelar con cambios pendientes, pide confirmación de "descartar cambios".
- No hay "focus trap" real (Tab no queda contenido dentro de los modales) — gap pendiente, no un requisito ya cumplido.
- Las notificaciones toast no tienen `aria-live`/`role="status"` ni botón de cierre manual — gap de accesibilidad [E].
- Toggle mostrar/ocultar contraseña (ícono de ojo) en login, edición de usuario y cambio de contraseña obligatorio.

## 13. Funcionalidad temporal / mock (C)

- Autenticación: comparación de contraseña en texto plano; usuario `admin/123` hardcodeado como bypass; `token` siempre `null`.
- Almacenamiento: **todo** en arrays en memoria del proceso Node — se pierde al reiniciar el backend (confirmado en `README_BACKEND.md`: "Pendientes para MySQL").
- `environment.usarDatosPrueba` y `inicializarDatosPrueba()` no siembran datos de prueba reales — la función solo vacía los arrays (nombre engañoso, no hace lo que sugiere).
- Adjuntos de mensajes: el usuario selecciona archivos reales (`File[]`) pero **solo se envía el nombre** como texto en el campo `documento`; no hay subida real de bytes ni almacenamiento en servidor (Multer está listado como pendiente en el README del backend).
- Botón "Descargar" en Formatos: solo dispara una notificación ("Descargando documento de prueba...").
- Contador de visitas en `localStorage`.
- Ficha PDF de usuario: HTML generado en cliente + `window.print()`, no un PDF real emitido por servidor.
- `descargarPdfUsuario` inserta valores en el HTML de una ventana nueva vía template strings sin sanitizar — con datos actuales controlados (nombre/rol/correo/área provienen del propio sistema de administración), pero es un patrón fresco de riesgo si en V2 esos campos permiten texto libre no confiable.

## 14. Bugs / deuda técnica que NO deben trasladarse (E)

- Enlace de descarga de adjuntos apunta a un endpoint inexistente (`/mensajes/descargar/:doc`) y hardcodea `http://localhost:3000` en vez de `environment.apiUrl`.
- `cancelarMensaje()` para estado `'Enviado'` cambia `msg.estado = 'Cancelado'` **solo en memoria del cliente** tras un `setTimeout` simulado, sin ninguna llamada HTTP — el cambio no persiste si se recarga la página.
- `generarPasswordTemporal()` y el campo `passwordTemporal` están definidos en el componente pero **nunca se invocan/renderizan** desde la plantilla — código muerto (distinto de `generarContrasenaEdicionAdmin()`, que sí se usa).
- Falta de autorización real en el backend: el filtrado por rol de administrador es puramente de UI; cualquier request HTTP directo puede leer/crear/editar usuarios sin credenciales.
- Sin `aria-live` en notificaciones toast; sin botón de cierre manual; sin manejo de Escape para el modal de confirmación genérica; sin focus trap en ningún modal.
- Endpoints backend completamente huérfanos de la UI: todo el CRUD de `formatos` (excepto GET plano), `PATCH /recordatorios/:id`, `DELETE /usuarios/:id`, `GET :id` en usuarios/mensajes, `/categoria` y `/fecha` filtrados server-side (el frontend filtra client-side igualmente).
- Interfaz `ArchivoAdjunto` definida y nunca usada en ningún lugar del código.
- Dos patrones de confirmación distintos para la misma acción conceptual ("eliminar mensaje"): modal genérico para recibidos vs. doble-clic con expiración de 5s para enviados.

## 15. Contradicciones encontradas

- **Reglas de validación duplicadas y divergentes** frontend↔backend: longitud mínima de contraseña (8 en frontend, sin mínimo en backend) y longitud máxima de recordatorio (150 en frontend, sin límite en backend).
- **Restricción de rol "Administrador"**: el frontend la trata como control de acceso real (oculta el módulo, redirige, notifica error); el backend no la aplica en absoluto — cualquiera con acceso a la API puede saltarse la restricción.
- **`rol` como enum vs. string libre**: la UI limita a 2 valores fijos vía `<select>`; el modelo de datos (frontend y backend) lo tipa como `string` sin restricción real.
- **`DELETE` de usuario**: el backend lo implementa como soft-delete (equivalente a desactivar), pero la UI ya tiene un mecanismo distinto (PATCH de estado) para lo mismo y nunca llama al DELETE — dos caminos para el mismo resultado, uno de ellos sin usar.
- **Descarga de adjuntos**: la UI asume que existe un endpoint de descarga de archivos; el backend nunca lo implementó.

## 16. Decisiones pendientes / información insuficiente (F)

- ¿El campo `rol` debe ser un catálogo cerrado (Administrador/Usuario) o se prevén más roles a futuro (p. ej. roles por área/dirección)?
- ¿Qué debe pasar con mensajes "eliminados" (Papelera)? ¿Restaurar, purga automática por antigüedad, purga manual definitiva?
- ¿Se requiere subida y almacenamiento real de archivos adjuntos en mensajes y en formatos? ¿Dónde (disco, objeto/S3, base de datos) y con qué límites de tamaño/tipo?
- ¿El módulo Formatos necesita una interfaz de administración (crear/editar/eliminar categorías y documentos), dado que el backend ya contempla el CRUD pero la UI de V1 nunca lo expuso?
- ¿Es un requisito real que la interacción entre el modal de Calendario y el modal de Detalle de mensaje permita apilarse (abrir uno sobre otro), o deberían comportarse como una navegación exclusiva?
- ¿Los campos de Perfil marcados "Pendiente de vincular" (adscripción, puesto, correo institucional, número de empleado) son datos reales a incorporar al modelo de Usuario en V2?
- ¿Se requiere 320px como ancho mínimo soportado explícitamente, o 360px (el breakpoint más angosto observado) es suficiente?
- ¿La "Ficha PDF de usuario" debe seguir siendo impresión del navegador, o se espera generación real de PDF en servidor?
- Estrategia de autenticación/autorización definitiva (JWT, sesiones, expiración, refresh) — explícitamente marcada como decisión pendiente por el propio `CLAUDE.md` del proyecto.

## 17. Preguntas para el administrador / supervisor

1. ¿El rol de usuario debe ampliarse más allá de Administrador/Usuario (por ejemplo, por Secretaría/Dirección), o dos roles son suficientes para V2?
2. ¿Qué política de retención se espera para mensajes eliminados (Papelera): restaurables, purga automática tras N días, purga manual, o eliminación definitiva inmediata?
3. ¿Es indispensable el envío y almacenamiento real de archivos adjuntos desde el lanzamiento de V2, o puede diferirse a una fase posterior?
4. ¿Quién debe poder administrar el catálogo de Formatos (categorías y documentos): solo Administrador del sistema, o un rol editorial distinto?
5. ¿Existen restricciones institucionales sobre tipos/tamaños de archivo permitidos en adjuntos y formatos?
6. ¿Se debe completar el módulo de Perfil con datos reales de RR. HH. (adscripción, puesto, correo institucional, número de empleado), y de dónde provendrían esos datos (¿otro sistema institucional, carga manual por Administrador?)
7. ¿Cuál es la expectativa de sesión: duración, expiración, cierre automático por inactividad, uso en múltiples dispositivos simultáneos?
8. ¿Hay requisitos normativos de accesibilidad (p. ej. WCAG 2.1 AA) o de navegadores/dispositivos mínimos a soportar formalmente?
9. ¿Los 11 nombres de categorías de Formatos son fijos y aprobados, o deben ser configurables por un administrador?
10. ¿Existe ya una base de usuarios real (RR. HH./LDAP/Active Directory) con la que integrar, o los usuarios se crearán manualmente en el nuevo sistema desde cero?

---

**Nota final del inventario:** las secciones 1–17 resumen el análisis solicitado y no contienen ninguna propuesta de arquitectura, estructura de carpetas, componentes, servicios, ORM ni tecnología para V2. No se realizó ningún cambio de código, ninguna instalación de dependencias ni ninguna operación de Git más allá de las verificaciones de lectura indicadas al inicio.

> Documento fuente: análisis funcional exhaustivo de V1 producido durante la FASE 0 de la reconstrucción de SIIntranet. Ver también `docs/decisiones-funcionales-v2.md` y `docs/arquitectura-v2.md`.
