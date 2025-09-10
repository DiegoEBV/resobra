-- Verificar datos en tablas relacionadas
SELECT 'Frentes' as tabla, COUNT(*) as total FROM frentes;
SELECT 'Kilometros' as tabla, COUNT(*) as total FROM kilometros;
SELECT 'Actividades' as tabla, COUNT(*) as total FROM actividades;

-- Verificar frentes con rangos kilométricos
SELECT 
  id,
  nombre,
  km_inicial,
  km_final,
  coordenadas_inicio,
  coordenadas_fin
FROM frentes 
WHERE km_inicial IS NOT NULL AND km_final IS NOT NULL;

-- Verificar kilómetros existentes
SELECT 
  k.id,
  k.frente_id,
  f.nombre as frente_nombre,
  k.kilometro,
  k.estado,
  k.progreso_porcentaje,
  k.actividades_count
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;

-- Verificar actividades con ubicación
SELECT 
  a.id,
  a.tipo_actividad,
  a.frente_id,
  f.nombre as frente_nombre,
  a.ubicacion_lat,
  a.ubicacion_lng,
  a.progreso_porcentaje,
  a.kilometro,
  a.kilometraje_inicio,
  a.kilometraje_fin
FROM actividades a
JOIN frentes f ON a.frente_id = f.id
WHERE a.ubicacion_lat IS NOT NULL AND a.ubicacion_lng IS NOT NULL
ORDER BY f.nombre, a.tipo_actividad;