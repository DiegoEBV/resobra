-- Consulta para debuggear el problema de tareas
-- Verificar todas las tareas y sus actividades relacionadas

SELECT 
    t.id as tarea_id,
    t.actividad_id,
    t.nombre as tarea_nombre,
    t.descripcion,
    t.completada,
    t.orden,
    t.fecha_creacion,
    a.id as actividad_real_id,
    a.tipo_actividad,
    a.estado as actividad_estado,
    a.created_at as actividad_creada
FROM tareas t
LEFT JOIN actividades a ON t.actividad_id = a.id
ORDER BY t.fecha_creacion DESC
LIMIT 20;

-- Verificar actividades recientes sin tareas
SELECT 
    a.id,
    a.tipo_actividad,
    a.estado,
    a.created_at,
    COUNT(t.id) as total_tareas
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE a.created_at > NOW() - INTERVAL '1 day'
GROUP BY a.id, a.tipo_actividad, a.estado, a.created_at
ORDER BY a.created_at DESC;

-- Verificar permisos en la tabla tareas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'tareas'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;