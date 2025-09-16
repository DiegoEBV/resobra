-- Verificar tareas para la actividad específica mostrada en la interfaz
SELECT 
    'ACTIVIDAD_ESPECIFICA' as tipo,
    a.id as actividad_id,
    a.tipo_actividad,
    a.estado,
    a.created_at as actividad_creada,
    COUNT(t.id) as total_tareas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.id = '56a55aa5-8b22-4a31-a5f9-dfe8d79e14e3'
GROUP BY a.id, a.tipo_actividad, a.estado, a.created_at;

-- Verificar si existen tareas para esta actividad específica
SELECT 
    'TAREAS_ACTIVIDAD_ESPECIFICA' as tipo,
    t.id,
    t.actividad_id,
    t.nombre,
    t.descripcion,
    t.completada,
    t.orden,
    t.fecha_creacion
FROM tareas t
WHERE t.actividad_id = '56a55aa5-8b22-4a31-a5f9-dfe8d79e14e3'
ORDER BY t.orden;

-- Verificar todas las actividades de excavación y sus tareas
SELECT 
    'ACTIVIDADES_EXCAVACION' as tipo,
    a.id as actividad_id,
    a.tipo_actividad,
    COUNT(t.id) as total_tareas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.tipo_actividad = 'excavacion'
GROUP BY a.id, a.tipo_actividad
ORDER BY a.created_at DESC;