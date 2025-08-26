# Deployment a GitHub Pages

## Configuración completada

Este proyecto ya está configurado para deployment automático en GitHub Pages usando `angular-cli-ghpages`.

## Scripts disponibles

### Build para producción
```bash
npm run build:prod
```
Genera el build de producción con el base-href configurado para GitHub Pages.

### Deploy a GitHub Pages
```bash
npm run deploy:gh-pages
```
Este comando:
1. Construye la aplicación usando la configuración `github-pages`
2. Despliega automáticamente a GitHub Pages usando `angular-cli-ghpages`

## Pasos para el primer deployment

1. **Asegúrate de que tu repositorio esté en GitHub**
2. **Ejecuta el comando de deploy:**
   ```bash
   npm run deploy:gh-pages
   ```
3. **Ve a la configuración de tu repositorio en GitHub:**
   - Settings → Pages
   - Verifica que la fuente esté configurada como "Deploy from a branch"
   - Selecciona la rama `gh-pages`

## URL de la aplicación

Una vez desplegada, tu aplicación estará disponible en:
```
https://[tu-usuario].github.io/sistema-informes-obra/
```

## Configuración técnica

- **Base href:** `/sistema-informes-obra/`
- **Directorio de salida:** `dist/sistema-informes-obra/browser`
- **Configuración Angular:** `github-pages` (definida en `angular.json`)
- **Rama de deployment:** `gh-pages` (creada automáticamente)

## Notas importantes

- El comando `deploy:gh-pages` creará automáticamente la rama `gh-pages` si no existe
- Cada vez que ejecutes el comando, se actualizará el contenido en GitHub Pages
- Los cambios pueden tardar unos minutos en reflejarse en la URL pública