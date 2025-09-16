-- Verificar actividades y tareas creadas recientemente
-- Buscar actividades sin tareas y tareas huérfanas

-- 1. Actividades creadas en las últimas 24 horas con su conteo de tareas
SELECT 
    'ACTIVIDADES_RECIENTES' as tipo,
    a.id,
    a.tipo_actividad,
    a.estado,
    a.created_at,
    COUNT(t.id) as total_tareas,
    ARRAY_AGG(t.nombre ORDER BY t.orden) FILTER (WHERE t.nombre IS NOT NULL) as nombres_tareas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.id, a.tipo_actividad, a.estado, a.created_at
ORDER BY a.created_at DESC;

-- 2. Tareas creadas en las últimas 24 horas
SELECT 
    'TAREAS_RECIENTES' as tipo,
    t.id,
    t.actividad_id,
    t.nombre,
    t.descripcion,
    t.completada,
    t.orden,
    t.fecha_creacion,
    a.tipo_actividad,
    CASE 
        WHEN a.id IS NULL THEN 'ACTIVIDAD_NO_EXISTE'
        ELSE 'ACTIVIDAD_EXISTE'
    END as estado_actividad
FROM tareas t
LEFT JOIN actividades a ON t.actividad_id = a.id
WHERE t.fecha_creacion > NOW() - INTERVAL '24 hours'
ORDER BY t.fecha_creacion DESC;

-- 3. Verificar si hay problemas de UUID (tareas huérfanas)
SELECT 
    'TAREAS_HUERFANAS' as tipo,
    t.id as tarea_id,
    t.actividad_id,
    t.nombre,
    t.fecha_creacion
FROM tareas t
LEFT JOIN actividades a ON t.actividad_id = a.id
WHERE a.id IS NULL
ORDER BY t.fecha_creacion DESC;

-- 4. Actividades sin tareas (creadas recientemente)
SELECT 
    'ACTIVIDADES_SIN_TAREAS' as tipo,
    a.id,
    a.tipo_actividad,
    a.estado,
    a.created_at
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
AND t.id IS NULL
ORDER BY a.created_at DESC;