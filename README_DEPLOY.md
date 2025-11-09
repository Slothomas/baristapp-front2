# Despliegue en Azure Static Web Apps (Vite + React)

Este proyecto ya incluye un workflow de GitHub Actions en `.github/workflows/azure-static-web-apps.yml` que:
- Instala dependencias (`npm ci`)
- Ejecuta `npm run build` (salida en `dist/`)
- Publica a Azure Static Web Apps

## Pasos rápidos

1. **Crear repositorio en GitHub** (vacío) y subir este código en la rama `main`.
2. En **Settings → Secrets and variables → Actions → New repository secret**, crear:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` con el token que entrega Azure al vincular el repo.
3. En Azure Portal, crear un recurso **Static Web App** y vincular el repositorio **GitHub** y la rama `main`.  
   - *App location*: `/`
   - *Output location*: `dist`
4. Hacer un `git push` a `main`. El workflow hará el build y deploy automáticamente.
