# Deployment Manual a GitHub Pages

Este proyecto ahora soporta un flujo de deployment manual simple, similar a otros proyectos Angular.

## Flujo Manual (Recomendado para desarrollo)

```bash
# 1. Construir el proyecto para GitHub Pages
npm run build

# 2. Desplegar a GitHub Pages
npm run deploy
```

## ¿Qué hace cada comando?

- **`npm run build`**: Construye el proyecto usando la configuración `github-pages` con el `baseHref` correcto
- **`npm run deploy`**: Usa `angular-cli-ghpages` para subir el contenido de `dist/sistema-informes-obra/browser` a la rama `gh-pages`

## Deployment Automático

El proyecto también mantiene el deployment automático via GitHub Actions cuando se hace push a la rama `main`.

## Notas

- El comando `build` ya incluye la configuración correcta para GitHub Pages
- No es necesario especificar parámetros adicionales
- El deployment manual es útil para pruebas rápidas sin hacer commit