-- Verificar datos kilométricos y su relación con frentes
-- Consulta para verificar los kilómetros insertados
SELECT 
    k.id,
    k.frente_id,
    k.kilometro,
    k.estado,
    k.color,
    k.progreso_porcentaje,
    k.actividades_count,
    f.nombre as frente_nombre,
    f.coordenadas_inicio,
    f.coordenadas_fin,
    f.km_inicial,
    f.km_final
FROM kilometros k
LEFT JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;

-- Verificar frentes con sus coordenadas
SELECT 
    id,
    nombre,
    coordenadas_inicio,
    coordenadas_fin,
    km_inicial,
    km_final
FROM frentes
WHERE coordenadas_inicio IS NOT NULL 
   AND coordenadas_fin IS NOT NULL;

-- Contar kilómetros por frente
SELECT 
    f.nombre,
    COUNT(k.id) as total_kilometros
FROM frentes f
LEFT JOIN kilometros k ON f.id = k.frente_id
GROUP BY f.id, f.nombre
ORDER BY f.nombre;