# Gestor Documental

Plataforma web inicial para gestion documental con Node.js, Express, PostgreSQL, Pug, Tailwind CSS y arquitectura MVC.

## Requisitos

- Node.js 18 o superior
- PostgreSQL 13 o superior
- `psql` disponible en PATH, o acceso a una consola de PostgreSQL

## Instalacion

```bash
npm install
```

## Configuracion

El archivo `.env` debe crearse a partir de `.env.example` o `.env.production.example` segun el entorno:

```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=document_manager
DB_USER=postgres
DB_PASSWORD=change_me
SESSION_SECRET=replace_with_a_long_random_secret
```

No subas ni compartas el archivo `.env` con credenciales reales.

## Base de datos

Opcion recomendada sin depender de `psql`:

```bash
npm run db:setup
```

Ese comando crea la base definida en `.env` si no existe y aplica `sql/schema.sql`.

Opcion manual:

1. Crea la base de datos:

```bash
createdb -U postgres document_manager
```

Si no tienes `createdb`, usa:

```bash
psql -U postgres -c "CREATE DATABASE document_manager;"
```

2. Ejecuta el esquema:

```bash
npm run db:init
```

Comando equivalente:

```bash
psql -U postgres -d document_manager -f ./sql/schema.sql
```

3. Crea o actualiza el usuario administrador inicial:

```bash
npm run db:seed
```

Credenciales iniciales desde `.env`:

- Email: `admin@example.com`
- Password: `Admin12345!`

## Tailwind CSS

Compilar estilos una vez:

```bash
npm run build:css
```

Compilar en modo observacion:

```bash
npm run watch:css
```

## Ejecucion

Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

La aplicacion queda disponible en:

```text
http://localhost:3003
```

## Scripts disponibles

- `npm start`: inicia Express.
- `npm run dev`: inicia Express con nodemon y Tailwind en watch.
- `npm run build:css`: compila Tailwind a `src/public/css/styles.css`.
- `npm run watch:css`: observa cambios de Tailwind.
- `npm run db:setup`: crea la base si falta y aplica el esquema usando Node.js.
- `npm run db:init`: ejecuta `sql/schema.sql`.
- `npm run db:seed`: crea el administrador inicial con bcrypt.

## Estructura

```text
document-manager/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    utils/
    views/
    public/
    uploads/
    app.js
  sql/
    schema.sql
  scripts/
    seedAdmin.js
```

## Funcionalidad incluida

- Login/logout con `express-session`.
- Sesiones persistidas en PostgreSQL con `connect-pg-simple`.
- Passwords con bcrypt.
- Middleware para proteger rutas privadas.
- Roles iniciales `admin` y `user`.
- Dashboard con metricas y documentos recientes.
- Carga de documentos con multer.
- Validacion de PDF, Word, Excel e imagenes.
- Guardado local en `src/uploads`.
- Metadata de documentos en PostgreSQL.
- Listado, busqueda, filtro, detalle, descarga y borrado logico de documentos.
- Metadata documental con categoria, departamento, empresa, usuario dueno, fecha de alta editable y estado documental.
- Estados documentales permitidos: `Vigente`, `Revisión`, `Creación`, `Desactualizado`, `Obsoleto`.
- Relacion `Mostrar` para asignar multiples usuarios visibles por documento.
- Edicion de documentos desde el listado, incluyendo metadata, dueno, usuarios visibles y reemplazo opcional de archivo.
- Flujo de aprobacion para documentos en `Revisión` asignados al usuario dueno: aprobar cambia a `Vigente` y rechazar cambia a `Creación`.
- CRUD basico de categorias.
- CRUD basico de usuarios.
- Campos de usuario para departamento y empresa.
- Catalogos de departamentos y empresas administrables desde la vista de usuarios.
- Los catalogos de departamento y empresa solo se pueden eliminar si no tienen usuarios asignados.
- Layout administrativo responsivo con Pug y Tailwind CSS.
- Manejo global de errores.

## Notas de seguridad

- No guardes `.env` en repositorios publicos.
- Cambia `SESSION_SECRET` y las credenciales del administrador antes de usar el sistema fuera de desarrollo.
- Los nombres de archivos se sanitizan antes de guardarse.
- Las consultas usan parametros SQL.
- Las rutas privadas exigen sesion activa.
- La administracion de usuarios y categorias exige rol `admin`.
- Los formularios HTML usan token CSRF basado en sesion.
