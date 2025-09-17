-- Verificación final del estado de los kilómetros con colores
-- Esta consulta verifica que todos los kilómetros tengan colores asignados correctamente

-- 1. Verificar configuración de estados
SELECT 'Estados Config' as tabla, COUNT(*) as total FROM estados_config;

-- 2. Ver configuración de estados con colores
SELECT 
  estado_nombre,
  color_hex,
  umbral_minimo,
  umbral_maximo
FROM estados_config 
ORDER BY umbral_minimo;

-- 3. Verificar kilómetros con colores
SELECT 
  'Kilómetros con color' as descripcion,
  COUNT(*) as total
FROM kilometros 
WHERE color IS NOT NULL AND color != '';

-- 4. Verificar kilómetros sin color
SELECT 
  'Kilómetros sin color' as descripcion,
  COUNT(*) as total
FROM kilometros 
WHERE color IS NULL OR color = '';

-- 5. Ver distribución de kilómetros por estado y color
SELECT 
  estado,
  color,
  COUNT(*) as cantidad,
  ROUND(AVG(progreso_porcentaje), 2) as progreso_promedio
FROM kilometros 
GROUP BY estado, color
ORDER BY estado, color;

-- 6. Ver algunos ejemplos de kilómetros con sus datos
SELECT 
  k.id,
  k.kilometro,
  k.estado,
  k.progreso_porcentaje,
  k.color,
  f.nombre as frente_nombre
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY k.frente_id, k.kilometro
LIMIT 10;

-- 7. Verificar que el trigger está funcionando
SELECT 
  'Trigger existe' as verificacion,
  COUNT(*) as existe
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_kilometro_color';

-- 8. Verificar función existe
SELECT 
  'Función existe' as verificacion,
  COUNT(*) as existe
FROM information_schema.routines 
WHERE routine_name = 'update_kilometro_color_by_progress';