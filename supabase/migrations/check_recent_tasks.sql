-- Verificar tareas creadas en las últimas 24 horas
SELECT 
    'TAREAS RECIENTES' as tipo,
    t.id,
    t.actividad_id,
    t.nombre,
    t.completada,
    t.fecha_creacion,
    a.tipo_actividad
FROM tareas t
LEFT JOIN actividades a ON t.actividad_id = a.id
WHERE t.fecha_creacion > NOW() - INTERVAL '24 hours'
ORDER BY t.fecha_creacion DESC;

-- Verificar actividades creadas recientemente
SELECT 
    'ACTIVIDADES RECIENTES' as tipo,
    a.id,
    a.tipo_actividad,
    a.estado,
    a.created_at,
    COUNT(t.id) as total_tareas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.id, a.tipo_actividad, a.estado, a.created_at
ORDER BY a.created_at DESC;

-- Verificar si hay problemas de UUID
SELECT 
    'VERIFICACION UUID' as tipo,
    t.actividad_id as tarea_actividad_id,
    a.id as actividad_real_id,
    CASE 
        WHEN t.actividad_id = a.id THEN 'MATCH'
        ELSE 'NO MATCH'
    END as uuid_match
FROM tareas t
FULL OUTER JOIN actividades a ON t.actividad_id = a.id
WHERE t.fecha_creacion > NOW() - INTERVAL '24 hours'
   OR a.created_at > NOW() - INTERVAL '24 hours'
ORDER BY COALESCE(t.fecha_creacion, a.created_at) DESC;