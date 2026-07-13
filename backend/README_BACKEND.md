# Documentación Técnica - Backend

## Estructura (`src/modules/`)
- `auth`: Login simulado.
- `usuarios`: CRUD en memoria.
- `mensajes`: CRUD en memoria.
- `formatos`: CRUD en memoria.
- `recordatorios`: CRUD en memoria.
- `archivos`: Manejo de metadatos.

## Pendientes para MySQL
1. Conectar TypeORM/Sequelize y configurar `.env`.
2. Habilitar JWT y Guards de seguridad.
3. Cifrar contraseñas con bcrypt.
4. Implementar subida real de archivos (Multer).
