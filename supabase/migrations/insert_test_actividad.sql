-- Insertar actividad de prueba para debug
INSERT INTO actividades (
  obra_id,
  frente_id,
  user_id,
  tipo_actividad,
  fecha,
  ubicacion,
  responsable,
  estado,
  observaciones,
  progreso_porcentaje,
  ubicacion_direccion,
  ubicacion_lat,
  ubicacion_lng
) 
SELECT 
  o.id as obra_id,
  f.id as frente_id,
  u.id as user_id,
  'Prueba Debug' as tipo_actividad,
  CURRENT_DATE as fecha,
  '{"lat": -16.5000, "lng": -68.1500}' as ubicacion,
  'Test User' as responsable,
  'programado' as estado,
  'Actividad creada para debug de eliminación' as observaciones,
  25 as progreso_porcentaje,
  'La Paz, Bolivia' as ubicacion_direccion,
  -16.5000 as ubicacion_lat,
  -68.1500 as ubicacion_lng
FROM obras o
CROSS JOIN frentes f
CROSS JOIN users u
WHERE o.id IS NOT NULL 
  AND f.id IS NOT NULL 
  AND u.id IS NOT NULL
LIMIT 1;