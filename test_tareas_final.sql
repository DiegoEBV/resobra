-- Consulta final para verificar el estado de actividades y tareas
-- Ejecutar después de crear una nueva actividad con tareas

SELECT 'ACTIVIDADES RECIENTES' as tipo;
SELECT 
    id,
    tipo_actividad,
    responsable,
    created_at,
    updated_at
FROM actividades 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'TAREAS RECIENTES' as tipo;
SELECT 
    id,
    actividad_id,
    nombre,
    descripcion,
    completada,
    created_at,
    updated_at
FROM tareas 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'RELACION ACTIVIDADES-TAREAS' as tipo;
SELECT 
    a.id as actividad_id,
    a.tipo_actividad,
    a.responsable,
    COUNT(t.id) as total_tareas,
    SUM(CASE WHEN t.completada = true THEN 1 ELSE 0 END) as tareas_completadas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY a.id, a.tipo_actividad, a.responsable
ORDER BY a.created_at DESC;

SELECT 'VERIFICACION UUID' as tipo;
SELECT 
    'Actividades con UUID válido' as descripcion,
    COUNT(*) as cantidad
FROM actividades 
WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

SELECT 
    'Tareas con UUID válido' as descripcion,
    COUNT(*) as cantidad
FROM tareas 
WHERE actividad_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';