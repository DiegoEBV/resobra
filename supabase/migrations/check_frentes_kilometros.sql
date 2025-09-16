-- Verificar frentes y sus rangos kilométricos
SELECT 
  f.id,
  f.nombre,
  f.km_inicial,
  f.km_final,
  f.estado,
  f.progreso_general,
  COUNT(k.id) as kilometros_generados
FROM frentes f
LEFT JOIN kilometros k ON f.id = k.frente_id
GROUP BY f.id, f.nombre, f.km_inicial, f.km_final, f.estado, f.progreso_general
ORDER BY f.nombre;

-- Verificar si hay frentes sin rangos kilométricos definidos
SELECT 
  'Frentes sin rangos kilométricos' as tipo,
  COUNT(*) as cantidad
FROM frentes 
WHERE km_inicial IS NULL OR km_final IS NULL;

-- Verificar actividades y su ubicación kilométrica
SELECT 
  a.id,
  a.tipo_actividad,
  a.frente_id,
  f.nombre as frente_nombre,
  a.kilometro,
  a.kilometraje_inicio,
  a.kilometraje_fin,
  a.progreso_porcentaje,
  a.estado
FROM actividades a
JOIN frentes f ON a.frente_id = f.id
WHERE a.kilometro IS NOT NULL OR a.kilometraje_inicio IS NOT NULL
ORDER BY f.nombre, a.kilometro