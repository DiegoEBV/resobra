# Sistema de Curvas para Frentes de Trabajo

## Descripción General

Este sistema permite definir frentes de trabajo que siguen la geometría real de carreteras con curvas, no solo líneas rectas. La implementación incluye puntos de control intermedios que permiten crear rutas más precisas y realistas.

## Características Principales

### 1. Coordenadas Intermedias
- **Campo agregado**: `coordenadas_intermedias` en la interfaz `Frente`
- **Estructura**: Array de objetos con `lat`, `lng` y `kilometraje`
- **Propósito**: Definir puntos de control a lo largo de la curva

### 2. Interfaz de Edición Mejorada
- **Mapa interactivo**: Permite agregar puntos haciendo clic
- **Gestión de waypoints**: Interfaz para editar puntos intermedios
- **Validación**: Verificación de kilometrajes y coordenadas

### 3. Interpolación Avanzada
- **Método**: `interpolateAlongCurve()` reemplaza interpolación lineal simple
- **Algoritmo**: Interpolación por segmentos entre puntos de control
- **Precisión**: Ubicación exacta de kilómetros a lo largo de la curva

## Implementación Técnica

### Estructura de Datos

```typescript
interface Frente {
  // ... campos existentes
  coordenadas_intermedias?: {
    lat: number;
    lng: number;
    kilometraje: number;
  }[];
}
```

### Componentes Modificados

#### 1. FrenteEditComponent
- **Archivo**: `src/app/components/frente-edit/frente-edit.component.ts`
- **Funcionalidad**:
  - Mapa interactivo para seleccionar puntos
  - Gestión de coordenadas intermedias
  - Formulario reactivo con validaciones

#### 2. MapaComponent
- **Archivo**: `src/app/pages/mapa/mapa.component.ts`
- **Funcionalidad**:
  - Visualización de rutas con curvas
  - Interpolación precisa de kilómetros
  - Renderizado de segmentos curvos

### Métodos Clave

#### `interpolateAlongCurve(frente: Frente, targetKilometraje: number)`
- **Propósito**: Interpolar coordenadas exactas en un kilometraje específico
- **Algoritmo**:
  1. Crear array de puntos de control ordenados por kilometraje
  2. Encontrar segmento que contiene el kilometraje objetivo
  3. Interpolar linealmente dentro del segmento
  4. Fallback a interpolación simple si no se encuentra segmento

#### `getRoutePoints(frente: Frente)`
- **Propósito**: Obtener todos los puntos que definen la ruta completa
- **Proceso**:
  1. Agregar punto inicial
  2. Agregar puntos intermedios ordenados
  3. Agregar punto final

#### `createKilometricRoute(frente: Frente, kilometros: Kilometro[])`
- **Propósito**: Crear visualización kilométrica siguiendo la curva
- **Características**:
  - Línea base siguiendo todos los puntos de control
  - Segmentos coloreados por estado
  - Popups informativos

## Flujo de Uso

### Creación de Frente con Curvas

1. **Acceder al formulario**: Navegar a crear/editar frente
2. **Definir punto inicial**: Hacer clic en el mapa para establecer inicio
3. **Definir punto final**: Segundo clic para establecer fin
4. **Agregar puntos intermedios**: Clics adicionales para waypoints
5. **Configurar kilometrajes**: Ajustar valores en el panel de puntos intermedios
6. **Guardar**: Validar y persistir el frente

### Visualización en Mapa Principal

1. **Carga automática**: Los frentes se cargan con sus curvas
2. **Renderizado**: Las rutas siguen la geometría real definida
3. **Kilómetros precisos**: Ubicación exacta basada en interpolación
4. **Interactividad**: Popups con información detallada

## Beneficios del Sistema

### 1. Precisión Geográfica
- Rutas que siguen la geometría real de carreteras
- Ubicación exacta de kilómetros en curvas
- Mejor representación de la realidad

### 2. Flexibilidad
- Número variable de puntos de control
- Edición visual intuitiva
- Adaptable a cualquier geometría

### 3. Compatibilidad
- Retrocompatible con frentes lineales existentes
- Fallback automático a interpolación simple
- No requiere migración de datos existentes

## Consideraciones Técnicas

### Performance
- Interpolación eficiente O(n) donde n = número de puntos intermedios
- Renderizado optimizado con Leaflet
- Carga lazy de datos kilométricos

### Validaciones
- Kilometrajes ordenados secuencialmente
- Coordenadas válidas (lat/lng)
- Rangos kilométricos coherentes

### Mantenimiento
- Código modular y bien documentado
- Separación clara de responsabilidades
- Pruebas unitarias recomendadas

## Archivos Modificados

1. **Interfaces**:
   - `src/app/services/actividades.service.ts` - Interfaz Frente actualizada
   - `src/app/interfaces/database.interface.ts` - Definiciones de tipos

2. **Componentes**:
   - `src/app/components/frente-edit/` - Editor de frentes
   - `src/app/pages/mapa/` - Visualización principal

3. **Base de Datos**:
   - `supabase/migrations/` - Migración para coordenadas_intermedias

## Próximos Pasos Sugeridos

1. **Pruebas**: Implementar tests unitarios para interpolación
2. **Optimización**: Cache de cálculos de interpolación
3. **UX**: Mejoras en la interfaz de edición de puntos
4. **Validación**: Reglas de negocio más estrictas
5. **Exportación**: Funcionalidad para exportar rutas a formatos GIS

---

*Documentación generada para el sistema de curvas v1.0*
*Fecha: Enero 2025*