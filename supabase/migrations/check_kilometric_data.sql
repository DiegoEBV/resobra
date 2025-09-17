-- Verificar datos kilométricos y su visualización en el mapa
-- Consulta para verificar frentes con coordenadas
SELECT 
    f.id,
    f.nombre,
    f.km_inicial,
    f.km_final,
    f.coordenadas_inicio,
    f.coordenadas_fin,
    f.coordenadas_intermedias,
    f.estado
FROM frentes f
WHERE f.coordenadas_inicio IS NOT NULL 
  AND f.coordenadas_fin IS NOT NULL;

-- Verificar kilómetros existentes
SELECT 
    k.id,
    k.frente_id,
    k.kilometro,
    k.estado,
    k.color,
    k.progreso_porcentaje,
    k.actividades_count,
    f.nombre as frente_nombre
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;

-- Verificar actividades con kilometraje
SELECT 
    a.id,
    a.frente_id,
    a.kilometro,
    a.progreso_porcentaje,
    a.estado,
    a.tipo_actividad,
    f.nombre as frente_nombre
FROM actividades a
JOIN frentes f ON a.frente_id = f.id
WHERE a.kilometro IS NOT NULL
ORDER BY f.nombre, a.kilometro;

-- Contar registros por tabla
SELECT 'frentes' as tabla, COUNT(*) as total FROM frentes
UNION ALL
SELECT 'kilometros' as tabla, COUNT(*) as total FROM kilometros
UNION ALL
SELECT 'actividades' as tabla, COUNT(*) as total FROM actividades
UNION ALL
SELECT 'actividades_con_kilometro' as tabla, COUNT(*) as total FROM actividades WHERE kilometro IS NOT NULL;