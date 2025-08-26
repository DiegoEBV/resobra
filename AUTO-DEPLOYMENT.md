# 🚀 Deployment Automático a GitHub Pages

## ✅ Configuración Completada

Tu proyecto ahora tiene configurado un **deployment automático** a GitHub Pages usando GitHub Actions. ¡Ya no necesitas ejecutar `npm run deploy` manualmente!

## 🔄 Cómo Funciona

Cada vez que hagas **push** a la rama `main`, el workflow automáticamente:

1. 🏗️ **Build del proyecto** con la configuración de GitHub Pages
2. 📦 **Instala dependencias** usando npm ci
3. 🚀 **Despliega automáticamente** a GitHub Pages
4. ✅ **Actualiza tu sitio web** sin intervención manual

## 📋 Pasos para Usar el Deployment Automático

### 1. Hacer cambios en tu código
```bash
# Edita tus archivos normalmente
# Ejemplo: modificar src/app/pages/main/main.component.ts
```

### 2. Commit y push a main
```bash
git add .
git commit -m "Descripción de tus cambios"
git push origin main
```

### 3. ¡Listo! 🎉
- Ve a la pestaña **Actions** en tu repositorio de GitHub
- Verás el workflow ejecutándose automáticamente
- En 2-3 minutos tu sitio estará actualizado

## 🔍 Monitorear el Deployment

### En GitHub:
1. Ve a tu repositorio en GitHub
2. Haz clic en la pestaña **Actions**
3. Verás el workflow "Deploy to GitHub Pages" ejecutándose
4. Haz clic en el workflow para ver los detalles

### Estados del Workflow:
- 🟡 **En progreso**: El deployment está ejecutándose
- ✅ **Completado**: Tu sitio se actualizó exitosamente
- ❌ **Fallido**: Hubo un error (revisa los logs)

## 🛠️ Configuración del Workflow

El archivo `.github/workflows/deploy.yml` contiene:

- **Trigger**: Se ejecuta en push a `main`
- **Node.js**: Versión 22 (compatible con tu proyecto)
- **Build**: Usa la configuración `github-pages`
- **Deploy**: Usa las acciones oficiales de GitHub Pages
- **Permisos**: Configurados para escribir en GitHub Pages

## 🚨 Importante

### Habilitar GitHub Pages (Solo la primera vez):
1. Ve a **Settings** → **Pages** en tu repositorio
2. En **Source**, selecciona **GitHub Actions**
3. ¡Listo! Los deployments automáticos funcionarán

### Comandos Manuales (Opcional):
```bash
# Si necesitas hacer deployment manual (no recomendado)
npm run deploy:gh-pages

# Para desarrollo local
npm start
```

## 🎯 Beneficios del Deployment Automático

✅ **Sin comandos manuales**: Solo haz push y listo
✅ **Siempre actualizado**: Tu sitio refleja el último código
✅ **Historial completo**: Todos los deployments quedan registrados
✅ **Rollback fácil**: Puedes revertir a commits anteriores
✅ **Colaboración**: Todo el equipo puede hacer deployments

---

**¡Tu Sistema de Informes de Obra ahora se despliega automáticamente! 🚀**