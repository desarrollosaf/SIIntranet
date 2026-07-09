# SIIntranet - Portal de Gestión del Poder Legislativo (Edoméx)

Este proyecto constituye la intranet institucional del Poder Legislativo del Estado de México (SIIntranet), desarrollada con una arquitectura desacoplada que integra un frontend interactivo en **Angular** y un backend en **NestJS**. El sistema provee flujos funcionales para el control de accesos, mensajería interna, formatos oficiales y recordatorios en calendario.

---

## 📁 Estructura de Carpetas

El repositorio está organizado de la siguiente manera:

* `src/` — Código fuente del **frontend** en Angular. Contiene el componente principal (`app.ts`, `app.html`, `app.scss`) y los archivos de configuración del cliente.
* `backend/` — Código fuente del **backend** en NestJS. Incluye los controladores, servicios, DTOs y validaciones de la API en `backend/src/modules`.
* `public/` — Directorio de activos estáticos del frontend (imágenes, logos institucionales y favicon).
* `reportes-locales/` — Carpeta local destinada a reportes de auditoría y análisis técnicos. Está configurada en `.gitignore` y es estrictamente local (no se sube al control de versiones).

---

## 🛠️ Requisitos del Entorno

Antes de iniciar el proyecto, asegúrese de tener instalados los siguientes componentes:

* **Node.js:** Versión 18 o superior (LTS recomendada).
* **npm:** Gestor de paquetes de Node (incluido por defecto con Node.js).
* **Angular CLI** (Opcional): Para gestionar o generar elementos en el cliente (`npm install -g @angular/cli`).
* **NestJS CLI** (Opcional): Para la gestión del servidor backend (`npm install -g @nestjs/cli`).

---

## 🚀 Instalación y Configuración

Siga estos pasos para instalar y configurar el proyecto localmente desde cero:

### 1. Instalación del Frontend
Abra una terminal en la raíz del proyecto y ejecute:
```bash
npm install
```

### 2. Instalación del Backend
En la misma terminal o en una nueva, acceda a la carpeta del backend e instale sus dependencias:
```bash
cd backend
npm install
```

### 3. Configuración del Archivo de Entorno del Backend
El backend de NestJS requiere de variables de configuración para inicializar sus servicios de red. Copie la plantilla `.env.example` en un nuevo archivo `.env`:
* **En Windows (PowerShell):**
  ```powershell
  copy backend/.env.example backend/.env
  ```
* **En macOS/Linux (Bash):**
  ```bash
  cp backend/.env.example backend/.env
  ```

---

## 💻 Ejecución en Modo Desarrollo

Para ejecutar el sistema completo, debe levantar de manera simultánea el backend y el frontend.

### Paso 1: Levantar el Backend (NestJS)
Desde el directorio del backend (`backend/`), inicie el servidor en modo desarrollo:
```bash
npm run start:dev
```
El servidor NestJS compilará el código y se mantendrá a la escucha de cambios en el puerto `3000`.

### Paso 2: Levantar el Frontend (Angular)
Regrese a la raíz del proyecto y levante el servidor de desarrollo de Angular:
```bash
cd ..
npm start
# O alternativamente:
# ng serve
```
El servidor de Angular se compilará y levantará en el puerto `4200`.

---

## 🔗 URLs de Acceso Local

Una vez iniciados ambos servicios, puede acceder a los siguientes puntos de enlace:

* **Frontend (Interfaz de Usuario):** [http://localhost:4200](http://localhost:4200)
* **Backend (API Base):** [http://localhost:3000/api](http://localhost:3000/api)
* **API Health Check (Estado del Servidor):** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🔑 Credenciales Temporales de Acceso

Dado que no se ha habilitado persistencia física todavía, se incluye una cuenta administradora de pruebas por defecto hardcodeada en el backend:

* **Usuario:** `admin`
* **Contraseña:** `123`

*Nota: Una vez iniciada la sesión, el administrador puede crear nuevas cuentas de usuario a través del panel de Administración. Dichos usuarios podrán loguearse normalmente mientras el servidor backend se mantenga encendido.*

---

## 📦 Módulos Funcionales

1. **🔑 Login:** Formulario de autenticación institucional, visibilidad de contraseña y control de estados (activo/inactivo).
2. **👥 Usuarios:** Módulo exclusivo para administradores. Permite visualizar, crear, editar y activar/desactivar cuentas de usuario. Cuenta con flujo de cambio obligatorio de contraseña en el primer inicio de sesión.
3. **✉️ Mensajes:** Bandeja de mensajería interna para el envío y recepción de documentos. Permite responder mensajes, editarlos y enviarlos a la papelera.
4. **📁 Formatos:** Categorías y formatos oficiales interactivos organizados por área de adscripción.
5. **📅 Recordatorios:** Calendario mensual completo con inserción de recordatorios rápidos con hora y fecha.

---

## ⚙️ Estado de Simulación (Mocks)

Actualmente, el sistema está configurado en una **fase pre-base de datos (Pre-BD)**, por lo que los siguientes servicios están simulados en memoria:

* **Base de Datos en Memoria:** Toda la información (usuarios creados, mensajes enviados y recordatorios agregados) reside en la memoria RAM del servidor de NestJS. Si el backend se detiene o reinicia, toda la información cargada se destruirá y el sistema volverá a su estado inicial vacío.
* **Sesión sin JWT Real:** Al iniciar sesión, la API retorna un token nulo (`token: null`). La autenticación se valida mediante condicionales en memoria dentro del controlador de NestJS, no por firma digital de tokens Bearer.
* **Seguridad Local:** La sesión del frontend se administra de manera temporal en el cliente mediante `sessionStorage`.
* **Contraseñas en Texto Plano:** Las contraseñas de los usuarios creados se comparan y almacenan en texto plano en la memoria.
* **Archivos Adjuntos Simulados:** El cargador de archivos de la mensajería solo captura metadatos (nombre y tamaño del archivo) en campos de texto de la base de datos temporal; no se realiza la subida física del binario a disco o almacenamiento en la nube (S3).
* **Descargas de Formatos:** Los PDFs de formato simulan el proceso de descarga emitiendo un toast informativo sin efectuar una descarga física en disco.

---

## 🚧 Próxima Fase: Integración con MySQL y Servidor Real

Para que el proyecto pase a un entorno de pre-producción/producción, se deberá implementar lo siguiente en la infraestructura física:

1. **Estructura de Base de Datos Real (MySQL):** Crear el esquema de base de datos relacional y conectar la API mediante TypeORM/Sequelize.
2. **Credenciales en Variables de Entorno:** Configurar las variables del archivo `.env` del backend para enlazarse de forma segura con el servidor MySQL.
3. **Seguridad JWT:** Firmar tokens JWT reales utilizando `@nestjs/jwt` y proteger todas las rutas privadas de la API aplicando `UseGuards(AuthGuard)`.
4. **Cifrado de Contraseñas:** Integrar la librería `bcrypt` en el backend para almacenar las contraseñas de los usuarios con hashing de seguridad.
5. **Subida Física de Archivos:** Integrar middleware de Multer para almacenar físicamente los adjuntos de mensajería en un volumen local o nube (S3).

---

## 🌿 Ramas del Repositorio

* `main` — Rama principal y estable. Contiene las últimas versiones unificadas de frontend y backend.
* `frontend` — Rama de desarrollo para diseño, plantillas de Angular y estilos.
* `backend` — Rama de desarrollo para lógica de NestJS, controladores y servicios en memoria.
* `pruebas` — Rama dedicada a pruebas unitarias y validación visual.

---

## 🚫 Archivos Excluidos del Control de Versiones

Asegúrese de **no agregar ni subir** los siguientes archivos locales a las ramas públicas de Git (los cuales están debidamente excluidos en `.gitignore`):

* Archivos de configuración locales con credenciales (`backend/.env`, `backend/.env.local`).
* Reportes locales generados (`reportes-locales/`).
* Bases de datos temporales o respaldos de datos (`.csv`, `.sql`).
* Dependencias compiladas (`node_modules/`, `backend/node_modules/`).
* Salida de compilación (`dist/`, `backend/dist/`).

---

## 🛠️ Comandos Útiles de Git

* **Ver estado actual del repositorio:**
  ```bash
  git status
  ```
* **Cambiar de rama:**
  ```bash
  git checkout <nombre_rama>
  ```
* **Crear una nueva rama local:**
  ```bash
  git checkout -b <nombre_nueva_rama>
  ```
* **Traer los últimos cambios del servidor remoto:**
  ```bash
  git pull origin <nombre_rama>
  ```
