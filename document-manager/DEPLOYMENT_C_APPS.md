# Despliegue en C:\Apps

1. Descomprime el ZIP en `C:\Apps\document-manager`.
2. Copia `.env.production.example` como `.env`.
3. Edita `.env` con las credenciales reales de PostgreSQL y un `SESSION_SECRET` seguro.
4. Instala dependencias de produccion:

```powershell
npm ci --omit=dev
```

5. Crea o actualiza la base de datos:

```powershell
npm run db:setup
npm run db:seed
```

6. Inicia la aplicacion:

```powershell
npm start
```

La aplicacion queda disponible por defecto en `http://localhost:3003`.

Notas:
- El ZIP no incluye `.env`, `node_modules` ni documentos cargados en `src/uploads`.
- El directorio `src/uploads` se incluye vacio para que el sistema pueda guardar nuevos documentos.
- Para correr como servicio en Windows, usa un administrador de procesos como NSSM o PM2.
