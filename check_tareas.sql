-- Consulta para verificar las tareas existentes y su relación con las actividades

-- 1. Ver todas las tareas con información de sus actividades relacionadas
SELECT 
    t.id as tarea_id,
    t.nombre as tarea_nombre,
    t.descripcion as tarea_descripcion,
    t.completada,
    t.orden,
    t.fecha_creacion,
    t.fecha_completado,
    a.id as actividad_id,
    a.tipo_actividad,
    a.fecha as actividad_fecha,
    a.responsable,
    a.estado as actividad_estado,
    a.progreso_porcentaje as actividad_progreso,
    f.nombre as frente_nombre,
    o.nombre as obra_nombre
FROM tareas t
INNER JOIN actividades a ON t.actividad_id = a.id
INNER JOIN frentes f ON a.frente_id = f.id
INNER JOIN obras o ON a.obra_id = o.id
ORDER BY t.fecha_creacion DESC;

-- 2. Contar tareas por estado de completado
SELECT 
    CASE 
        WHEN completada = true THEN 'Completadas'
        WHEN completada = false THEN 'Pendientes'
        ELSE 'Sin definir'
    END as estado_tarea,
    COUNT(*) as cantidad
FROM tareas
GROUP BY completada;

-- 3. Ver actividades sin tareas asignadas
SELECT 
    a.id as actividad_id,
    a.tipo_actividad,
    a.fecha,
    a.responsable,
    a.estado,
    f.nombre as frente_nombre,
    o.nombre as obra_nombre
FROM actividades a
INNER JOIN frentes f ON a.frente_id = f.id
INNER JOIN obras o ON a.obra_id = o.id
LEFT JOIN tareas t ON a.id = t.actividad_id
WHERE t.id IS NULL
ORDER BY a.fecha DESC;

-- 4. Resumen de tareas por actividad
SELECT 
    a.id as actividad_id,
    a.tipo_actividad,
    a.responsable,
    a.estado as actividad_estado,
    COUNT(t.id) as total_tareas,
    COUNT(CASE WHEN t.completada = true THEN 1 END) as tareas_completadas,
    COUNT(CASE WHEN t.completada = false THEN 1 END) as tareas_pendientes,
    ROUND(
        (COUNT(CASE WHEN t.completada = true THEN 1 END) * 100.0 / 
         NULLIF(COUNT(t.id), 0)), 2
    ) as porcentaje_completado
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
GROUP BY a.id, a.tipo_actividad, a.responsable, a.estado
HAVING COUNT(t.id) > 0
ORDER BY porcentaje_completado DESC;

-- 5. Tareas más recientes
SELECT 
    t.nombre as tarea,
    t.descripcion,
    t.completada,
    t.fecha_creacion,
    a.tipo_actividad,
    a.responsable,
    o.nombre as obra
FROM tareas t
INNER JOIN actividades a ON t.actividad_id = a.id
INNER JOIN obras o ON a.obra_id = o.id
ORDER BY t.fecha_creacion DESC
LIMIT 10;