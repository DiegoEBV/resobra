-- Consulta simple para verificar tareas existentes
SELECT 
    COUNT(*) as total_tareas,
    COUNT(CASE WHEN completada = true THEN 1 END) as tareas_completadas,
    COUNT(CASE WHEN completada = false THEN 1 END) as tareas_pendientes
FROM tareas;

-- Ver las últimas 5 tareas creadas
SELECT 
    t.nombre,
    t.descripcion,
    t.completada,
    t.fecha_creacion,
    a.tipo_actividad,
    a.responsable
FROM tareas t
JOIN actividades a ON t.actividad_id = a.id
ORDER BY t.fecha_creacion DESC
LIMIT 5;

-- Contar actividades con y sin tareas
SELECT 
    'Con tareas' as tipo,
    COUNT(DISTINCT a.id) as cantidad
FROM actividades a
JOIN tareas t ON a.id = t.actividad_id
UNION ALL
SELECT 
    'Sin tareas' as tipo,
    COUNT(a.id) as cantidad
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE t.id IS NULL;