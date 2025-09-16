-- Verificar si existen tareas en la base de datos
SELECT 
    t.id,
    t.actividad_id,
    t.nombre,
    t.completada,
    t.orden,
    a.tipo_actividad,
    a.estado as actividad_estado
FROM tareas t
LEFT JOIN actividades a ON t.actividad_id = a.id
ORDER BY t.actividad_id, t.orden;

-- Contar tareas por actividad
SELECT 
    actividad_id,
    COUNT(*) as total_tareas,
    COUNT(CASE WHEN completada = true THEN 1 END) as tareas_completadas
FROM tareas 
GROUP BY actividad_id;

-- Verificar actividades sin tareas
SELECT 
    a.id,
    a.tipo_actividad,
    a.estado,
    COUNT(t.id) as num_tareas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
GROUP BY a.id, a.tipo_actividad, a.estado
HAVING COUNT(t.id) = 0;