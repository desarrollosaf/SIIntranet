# Decisiones funcionales — SIIntranet V2

Consolida la matriz de decisión original (construida a partir del inventario de `docs/inventario-funcional-v1.md`) y su estado actualizado tras la aclaración del objetivo de la reconstrucción por parte del responsable del proyecto. Cada decisión indica: pregunta concreta, evidencia en V1, por qué V1 por sí solo no bastaba para decidir, impacto funcional, partes futuras afectadas, quién debía responder y prioridad original — seguido de su **estado final** (RESUELTA / PARCIAL / DIFERIDA / PENDIENTE).

No se agregaron decisiones nuevas ni se cambiaron requisitos respecto a lo ya aprobado. No se inventó información de la base de datos institucional.

---

## Matriz de decisión (detalle original)

### D01 — Roles
- **Pregunta concreta:** ¿El sistema debe soportar solo dos roles fijos (Administrador/Usuario) o un catálogo extensible de roles/permisos (p. ej. por Secretaría o Dirección)?
- **Evidencia en V1:** `rol` es `string` libre en el modelo (frontend y backend), pero el único punto de captura (`<select>` de administración de usuarios) limita a exactamente "Administrador"/"Usuario"; todo el control de acceso se reduce a un booleano (`usuarioActual.tipo === 'admin'`, derivado de `rol === 'Administrador'`).
- **Por qué V1 no basta:** V1 solo tiene un módulo restringido (Administración), por lo que nunca necesitó más de dos niveles; no hay evidencia de si la organización real requiere más granularidad.
- **Impacto funcional:** Define si el control de acceso de V2 es binario o un sistema de permisos.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Seguridad · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE.

### D02 — Mensajes eliminados / papelera
- **Pregunta concreta:** ¿Los mensajes eliminados deben poder restaurarse, purgarse automáticamente tras un plazo, o eliminarse definitivamente de forma manual?
- **Evidencia en V1:** `MensajesService.remove()` solo cambia `estado` a `'Eliminado'` (soft delete); la bandeja permite filtrar por "Eliminado" (etiquetado "Papelera"), pero no existe botón de restaurar ni de purga definitiva en toda la plantilla.
- **Por qué V1 no basta:** El soft delete pudo ser solo una limitación temporal del almacenamiento en memoria, no una decisión de retención documental.
- **Impacto funcional:** Modelo de datos (¿campo de fecha de purga?), cumplimiento de retención documental, necesidad de una pantalla de Papelera completa.
- **Partes futuras afectadas:** Modelo de datos · Backend · Frontend · UX.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D03 — Archivos adjuntos (subida y almacenamiento reales)
- **Pregunta concreta:** ¿V2 debe implementar subida, almacenamiento y descarga reales de archivos desde el lanzamiento, o puede diferirse?
- **Evidencia en V1:** El formulario captura `File[]` reales, pero solo se envía `.name` como texto; no existe endpoint de subida `multipart/form-data`; el enlace de descarga apunta a una ruta (`/mensajes/descargar/:doc`) inexistente en el backend; `README_BACKEND.md` lista "Implementar subida real de archivos (Multer)" como pendiente.
- **Por qué V1 no basta:** Solo hay evidencia de la intención (la UI la simula), no de los requisitos reales (tamaño máximo, tipos permitidos, retención, previsualización).
- **Impacto funcional:** Es una de las funciones más visibles del sistema; sin ella, Mensajería queda incompleta.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Seguridad · Frontend · UX.
- **Quién debía responder:** Administrador (requisitos) / decisión técnica posterior (estrategia de almacenamiento).
- **Prioridad original:** BLOQUEANTE.

### D04 — Administración de formatos
- **Pregunta concreta:** ¿Quién y cómo debe poder crear/editar/eliminar categorías y documentos del módulo Formatos?
- **Evidencia en V1:** El backend ya implementa CRUD completo (`POST/PATCH/DELETE /formatos`), pero ningún botón/formulario del frontend los invoca; la UI es de solo lectura más un botón "Descargar" que solo simula una notificación.
- **Por qué V1 no basta:** No se puede saber si el backend fue una implementación adelantada nunca conectada, o si "solo lectura" fue intencional.
- **Impacto funcional:** Determina si V2 necesita una pantalla de administración de Formatos o si el contenido se gestiona fuera del sistema.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Frontend · UX · Seguridad.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.
- **Nota de alcance (ETAPA 14B):** para el frontend V2 actual (13C), la consulta/descarga de Formatos ya está confirmada e implementada; no se requiere administración visual (crear/editar/eliminar/activar/desactivar/categorías) por ahora. Los endpoints administrativos de backend (13B) permanecen como infraestructura provisional sin consumidor frontend. La pregunta original de D04 (quién administra el catálogo a largo plazo) sigue sin resolver — esta nota no la cierra, solo aclara que no bloquea el alcance frontend vigente.

### D05 — Perfil y datos de RRHH
- **Pregunta concreta:** ¿Los campos de Perfil (adscripción, puesto, correo institucional, número de empleado) deben incorporarse al modelo de Usuario, y de dónde provienen?
- **Evidencia en V1:** El modal de Perfil muestra explícitamente esas cuatro filas con el valor literal "Pendiente de vincular"/"Pendiente" — la interfaz ya fue diseñada para mostrarlos, pero el dato nunca se conectó a ninguna fuente.
- **Por qué V1 no basta:** No se puede saber si deben capturarse manualmente en el propio sistema, sincronizarse desde un sistema de RR. HH. externo, o si el requisito fue descartado.
- **Impacto funcional:** Amplía el modelo de Usuario y puede requerir integración externa.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D06 — Ancho mínimo móvil soportado
- **Pregunta concreta:** ¿Cuál es el ancho mínimo de pantalla que V2 debe soportar formalmente (320px, 360px, u otro)?
- **Evidencia en V1:** Breakpoints detectados en `app.scss`: 1100px, 820px, 768px, 640px, 480px, 360px; no se encontró ningún ajuste específico en 320px.
- **Por qué V1 no basta:** Que el breakpoint más angosto sea 360px no confirma que 320px fuera descartado como requisito.
- **Impacto funcional:** Afecta el diseño responsive de cada pantalla.
- **Partes futuras afectadas:** Frontend · UX.
- **Quién debía responder:** Yo / Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D07 — PDF de usuario
- **Pregunta concreta:** ¿La ficha de usuario debe seguir generándose vía impresión del navegador, o se requiere un PDF real generado en servidor?
- **Evidencia en V1:** `descargarPdfUsuario()` abre una ventana nueva, escribe HTML con estilos inline y llama a `window.print()` — no hay generación de PDF real.
- **Por qué V1 no basta:** Es una solución pragmática/temporal; no hay evidencia de si cumple expectativas institucionales de formato, firma digital o membrete oficial.
- **Impacto funcional:** Bajo impacto arquitectónico general; afecta si se necesita generación de PDF en servidor.
- **Partes futuras afectadas:** Backend (si aplica) · Frontend.
- **Quién debía responder:** Administrador.
- **Prioridad original:** Puede decidirse posteriormente.

### D08 — Autenticación / sesión definitiva
- **Pregunta concreta:** ¿Qué mecanismo de autenticación, duración de sesión, expiración y renovación debe usar V2?
- **Evidencia en V1:** Login compara contraseñas en texto plano, acepta `admin/123` hardcodeado, `LoginResponse.token` siempre es `null` (`mode: 'mock'`); la sesión vive íntegramente en `sessionStorage` sin validación server-side posterior.
- **Por qué V1 no basta:** Es explícitamente mock; V1 no da ninguna pista de la política de seguridad institucional requerida.
- **Impacto funcional:** Es la base de seguridad de todo el sistema.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Seguridad · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE.

### D09 — Categorías de formatos
- **Pregunta concreta:** ¿Las 11 categorías institucionales son fijas y aprobadas, o deben ser configurables por un administrador?
- **Evidencia en V1:** `categoriasFormatos` es un arreglo de 11 strings hardcodeado en `app.ts`, sin origen en el backend.
- **Por qué V1 no basta:** No se puede saber si esa lista refleja la estructura orgánica vigente (que podría cambiar) o si solo se transcribió una vez y quedó fija.
- **Impacto funcional:** Determina si "categoría" es catálogo administrable o enum fijo.
- **Partes futuras afectadas:** Modelo de datos · Backend · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D10 — Edición de mensajes ya enviados
- **Pregunta concreta:** ¿Debe seguir permitiéndose editar el contenido de un mensaje después de enviado, y deben notificarse los cambios?
- **Evidencia en V1:** `puedeEditarMensajeEnviado()` permite editar en estados `Enviado, Visto, Nuevo, Respondido` — incluso después de que el destinatario lo marcó como visto o respondido.
- **Por qué V1 no basta:** Editar un documento tras ser leído por otro usuario es una decisión de integridad documental/institucional, no solo técnica.
- **Impacto funcional:** Afecta la confiabilidad de "Mensaje" como documento oficial.
- **Partes futuras afectadas:** Modelo de datos · Backend · Frontend · UX.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE.

### D11 — Significado real de "cancelar envío"
- **Pregunta concreta:** ¿Qué debe significar funcionalmente "cancelar" un mensaje ya enviado?
- **Evidencia en V1:** `cancelarMensaje()` para un mensaje `'Enviado'` solo simula un cambio de estado en memoria del cliente, sin ninguna llamada HTTP — no persiste y se pierde al recargar.
- **Por qué V1 no basta:** La función nunca se completó (es una simulación visual).
- **Impacto funcional:** Alto — función central de mensajería hoy rota/simulada.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Frontend · UX.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE.

### D12 — Destinatarios individuales vs. grupos/áreas
- **Pregunta concreta:** ¿Los mensajes deben poder enviarse a grupos/áreas completas, no solo a personas individuales?
- **Evidencia en V1:** `destinatarios` es un único `string` con nombres separados por coma; el selector solo lista personas individuales, nunca áreas completas.
- **Por qué V1 no basta:** No se puede inferir si enviar "a toda una Secretaría" es un caso de uso real no cubierto, o si nunca fue un requisito.
- **Impacto funcional:** Cambia el modelo de datos de Mensaje y el cálculo de estados de lectura (D13).
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE.

### D13 — Estado de lectura por destinatario
- **Pregunta concreta:** Con múltiples destinatarios, ¿el estado "Visto"/"Respondido" debe ser individual por destinatario, o global?
- **Evidencia en V1:** `estadoLectura`/`estadoRespuesta` son campos únicos en el propio objeto `Mensaje`; un mensaje con varios destinatarios comparte un solo estado entre todos.
- **Por qué V1 no basta:** Es una limitación estructural del modelo actual, no necesariamente el comportamiento deseado.
- **Impacto funcional:** Alto — sin corregirlo, un destinatario vería "Visto" solo porque otro ya lo abrió.
- **Partes futuras afectadas:** Modelo de datos · Backend · API · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE (ligada a D12).

### D14 — Necesidad de auditoría / historial
- **Pregunta concreta:** ¿Se requiere un registro de auditoría para acciones administrativas y de mensajería?
- **Evidencia en V1:** No existe ningún mecanismo de auditoría en absoluto.
- **Por qué V1 no basta:** Es una ausencia total, no una decisión visible.
- **Impacto funcional:** Relevante por transparencia gubernamental/normativa de un ente público.
- **Partes futuras afectadas:** Modelo de datos · Backend · Seguridad.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D15 — Recuperación / reset de contraseña (autoservicio)
- **Pregunta concreta:** ¿Los usuarios deben poder recuperar su propia contraseña, o el reset siempre pasa por un Administrador?
- **Evidencia en V1:** No existe flujo de "olvidé mi contraseña"; el único mecanismo es que un Administrador la regenere manualmente.
- **Por qué V1 no basta:** No se puede saber si fue una decisión de seguridad institucional o una funcionalidad no implementada.
- **Impacto funcional:** Afecta la carga operativa de administradores y requiere infraestructura de correo si se habilita autoservicio.
- **Partes futuras afectadas:** Backend · API · Seguridad · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D16 — Administración de contraseñas (políticas y validación consistente)
- **Pregunta concreta:** ¿Cuál es la política real de contraseñas, y debe aplicarse igual en frontend y backend?
- **Evidencia en V1:** El frontend exige mínimo 8 caracteres; el backend no valida ninguna longitud mínima.
- **Por qué V1 no basta:** El valor "8 caracteres" pudo ser arbitrario del desarrollo, no una política institucional real.
- **Impacto funcional:** Seguridad de acceso al sistema.
- **Partes futuras afectadas:** Backend · API · Seguridad · Frontend.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** BLOQUEANTE (parte del mismo diseño que D08).

### D17 — Límites y tipos de archivo permitidos
- **Pregunta concreta:** ¿Qué tipos de archivo y qué tamaño máximo deben permitirse en adjuntos?
- **Evidencia en V1:** No hay ninguna restricción implementada (los archivos ni siquiera se suben realmente, ver D03).
- **Por qué V1 no basta:** Es una decisión completamente nueva, ligada a la infraestructura de almacenamiento que se elija.
- **Impacto funcional:** Seguridad (evitar tipos de archivo maliciosos) y capacidad de almacenamiento.
- **Partes futuras afectadas:** Backend · API · Seguridad · Frontend.
- **Quién debía responder:** Administrador / Supervisor / decisión técnica posterior.
- **Prioridad original:** BLOQUEANTE (junto con D03).

### D18 — Comportamiento del calendario al abrir un mensaje
- **Pregunta concreta:** Al hacer clic en un evento tipo mensaje dentro del Calendario, ¿debe cerrarse el calendario, o pueden verse ambos a la vez?
- **Evidencia en V1:** El código sugiere que ambos modales podrían quedar apilados — no verificado visualmente.
- **Por qué V1 no basta:** Requiere verificación funcional además de una decisión de UX.
- **Impacto funcional:** Medio — claridad de navegación entre vistas anidadas.
- **Partes futuras afectadas:** Frontend · UX.
- **Quién debía responder:** Yo (verificación) / decisión técnica posterior de UX.
- **Prioridad original:** Puede decidirse posteriormente.
- **SUPERADA POR ACLARACIÓN DE ALCANCE (ETAPA 14B):** el responsable del proyecto confirmó que Calendario y Recordatorios no forman parte del sistema real tomado como referencia funcional y quedan FUERA DEL ALCANCE ACTUAL de SIIntranet V2. Esta decisión deja de ser aplicable mientras esa exclusión se mantenga — no debe diseñarse ni implementarse el comportamiento calendario↔detalle. Se conserva aquí como evidencia histórica del análisis original.

### D19 — Requisitos de accesibilidad formal
- **Pregunta concreta:** ¿Existe una normativa o estándar de accesibilidad formal que V2 deba cumplir?
- **Evidencia en V1:** Esfuerzo consistente pero informal de accesibilidad, sin referencia a un estándar; hay huecos claros (sin `aria-live`, sin focus trap real).
- **Por qué V1 no basta:** No permite inferir si responde a una obligación normativa verificable.
- **Impacto funcional:** Determina el rigor y las pruebas de accesibilidad requeridas por pantalla.
- **Partes futuras afectadas:** Frontend · UX.
- **Quién debía responder:** Administrador / Supervisor.
- **Prioridad original:** IMPORTANTE pero no bloqueante.

### D20 — Autorización real en el backend
- **Pregunta concreta:** ¿Cómo debe aplicarse la restricción de acceso por rol del lado del servidor?
- **Evidencia en V1:** Ningún controller tiene guard ni verificación de identidad; la única restricción vive en el componente Angular y es evadible llamando a la API directamente.
- **Por qué V1 no basta:** Es una ausencia total de diseño; depende de D01 y D08.
- **Impacto funcional:** Crítico — sin esto, ninguna restricción de acceso de V2 es real.
- **Partes futuras afectadas:** Backend · API · Seguridad.
- **Quién debía responder:** Decisión técnica posterior (una vez resueltos D01 y D08).
- **Prioridad original:** BLOQUEANTE.

---

## Estado final de las decisiones (post-aclaración del objetivo de la reconstrucción)

El responsable del proyecto aclaró que el objetivo inmediato de V2 **no** es rediseñar funcionalmente todo el sistema, sino conservar la base funcional ya validada de V1, reconstruirla con arquitectura correcta, e incorporar solo mejoras funcionales explícitamente aprobadas.

| ID | Tema | Estado | Resolución / restricción aplicable a la arquitectura |
|---|---|---|---|
| D01 | Roles | **RESUELTA** | Solo Administrador y Usuario. Área/adscripción/puesto no determinan permisos. Sin sistema dinámico de roles. |
| D02 | Eliminación de mensajes | **RESUELTA (funcional)** | Eliminar afecta a todos los destinatarios; deja de estar disponible; aviso "eliminado por el remitente"; se conserva evidencia interna (no borrado físico inmediato). Retención/purga definitiva: pendiente. |
| D03 | Archivos adjuntos | **RESUELTA** | Subida y almacenamiento reales, uno o varios archivos, descarga real por destinatarios autorizados. Estrategia física de almacenamiento diferida a cuando se conozca la infraestructura. |
| D04 | Administración de Formatos | **PENDIENTE** (frontend actual no bloqueado — ver nota 14B) | Punto de extensión aislado, no bloqueante. Consulta/descarga confirmadas e implementadas; administración visual no requerida actualmente. |
| D05 | Perfil / usuarios / BD institucional | **PARCIAL** | Existe MySQL institucional real, ya en uso por una versión previa; esquema aún no autorizado/conocido. Administrador debe poder gestionar y crear usuarios. Campos conceptuales (id, nombre, usuario, correo, área, puesto, número de empleado, rol, estado) son provisionales. Prohibido inventar tablas/columnas. |
| D06 | Ancho mínimo móvil | **PENDIENTE** | Punto de extensión aislado, no bloqueante. |
| D07 | PDF de usuario | **PENDIENTE** | Punto de extensión aislado, no bloqueante. |
| D08 | Autenticación / sesión | **DIFERIDA (explícita)** | Se prioriza corregir arquitectura primero. Puede conservarse conceptualmente el flujo de V1 (login/logout/cambio obligatorio) como implementación provisional, pero sin heredar el mock inseguro como requisito; debe ser sustituible sin rehacer el resto del sistema. |
| D09 | Categorías de Formatos | **PENDIENTE** | Punto de extensión aislado, no bloqueante. |
| D10 | Edición de mensajes enviados | **RESUELTA** | Editable únicamente mientras ningún destinatario lo haya visto; en cuanto uno lo ve, queda bloqueado (título, descripción, destinatarios, adjuntos). |
| D11 | Cancelar envío | **RESUELTA** | Cancelable únicamente mientras ningún destinatario lo haya visto; cancelar retira el mensaje de todas las bandejas y conserva "Cancelado" para el remitente; tras la primera vista, ya no se puede cancelar ni editar. |
| D12 | Destinatarios | **RESUELTA** | Siempre personas individuales seleccionadas (uno o varios). Sin selección automática de área/departamento/grupo. |
| D13 | Lectura/respuesta por destinatario | **RESUELTA** | Cada destinatario tiene su propio estado de lectura/respuesta, independiente de los demás. |
| D14 | Auditoría | **RESUELTA** | V2 debe auditar acciones relevantes (sesión, gestión de usuarios, resets administrativos de contraseña, ciclo de vida de mensajes, operaciones sobre formatos/recursos), consultable solo por Administrador, nunca registrando secretos. Retención/filtros/exportación: pendiente. |
| D15 | Recuperación de contraseña | **DIFERIDA** | Mantener el comportamiento funcional de V1 como referencia; flujo nuevo se define después. |
| D16 | Política de contraseñas | **DIFERIDA** | No fijar todavía complejidad/expiración/recuperación; debe quedar aislada/configurable. |
| D17 | Tipos y límites de archivo | **RESUELTA (provisional)** | Tipos permitidos: PDF, Word, Excel, PowerPoint, JPG/JPEG, PNG. Sin ejecutables ni tipos peligrosos. Tamaño máximo pendiente de infraestructura, debe ser configurable. |
| D18 | Calendario → detalle de mensaje | **SUPERADA POR ACLARACIÓN DE ALCANCE** | Calendario/Recordatorios quedan FUERA DE ALCANCE ACTUAL de V2 (confirmado por el responsable, ETAPA 14B). No debe diseñarse ni implementarse. Conservada como evidencia histórica. |
| D19 | Accesibilidad formal | **PENDIENTE** | Se seguirán buenas prácticas ya validadas en V1 mientras se define si hay estándar normativo formal. |
| D20 | Autorización real en backend | **Tarea de arquitectura** (ya no es decisión de negocio pendiente) | Con D01 resuelto y D08 diferida pero obligada a ser desacoplada, la protección real de endpoints por rol se diseña en la fase de arquitectura, de forma independiente del mecanismo de autenticación concreto que se elija después. |

### Orden recomendado con el que se resolvieron las decisiones bloqueantes

1. D01 — Roles (base de identidad y permisos)
2. D08 — Autenticación / sesión definitiva (diferida, pero desacoplada desde el diseño)
3. D16 — Políticas de contraseña (mismo diseño que D08, diferida)
4. D20 — Autorización real en el backend (pasó a tarea de arquitectura)
5. D12 — Destinatarios individuales vs. grupos/áreas
6. D13 — Estado de lectura por destinatario
7. D10 — Edición de mensajes ya enviados
8. D11 — Significado real de "cancelar envío"
9. D03 — Archivos adjuntos: subida y almacenamiento reales
10. D17 — Límites y tipos de archivo permitidos

### Decisiones que siguen realmente abiertas (no bloquean el diseño estructural)

D04 (administración de Formatos — no bloquea el frontend actual, ver nota 14B), D06 (ancho mínimo móvil formal), D07 (PDF real de usuario), D08 (autenticación/sesión definitiva — **diferida**, no pendiente ni resuelta), D09 (categorías de Formatos configurables), D15 (recuperación de contraseña), D16 (política definitiva de contraseñas), D19 (estándar de accesibilidad formal), y el esquema físico de la MySQL institucional (parte de D05). Todas se tratan como **puntos de extensión aislados** en la arquitectura de V2, no como diseño cerrado ni como información inventada.

### Nota de alcance — Calendario/Recordatorios (ETAPA 14B)

D18 queda **SUPERADA POR ACLARACIÓN DE ALCANCE**: el responsable del proyecto confirmó que Calendario y Recordatorios no formaban parte del sistema real usado como referencia funcional y no forman parte del alcance actual de SIIntranet V2. No se espera información de Calendario/Recordatorios en la base de datos institucional. Ambas funciones quedan FUERA DE ALCANCE ACTUAL y no deben diseñarse ni implementarse; solo podrían reconsiderarse si el administrador/supervisor lo solicita explícitamente en el futuro. Ver también `docs/inventario-funcional-v1.md` (nota posterior de alcance) y `docs/arquitectura-v2.md`.

---

> Fuente: matriz de decisión construida a partir de `docs/inventario-funcional-v1.md`. Ver `docs/arquitectura-v2.md` para cómo estas decisiones se tradujeron en la arquitectura final de V2.
