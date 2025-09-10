-- Agregar tareas de ejemplo para actividades existentes que no tienen tareas

-- Insertar tareas de ejemplo para actividades de pavimentación
INSERT INTO tareas (actividad_id, nombre, descripcion, completada, orden, fecha_creacion)
SELECT 
  a.id,
  tarea_nombre,
  tarea_descripcion,
  false,
  tarea_orden,
  NOW()
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
CROSS JOIN (
  VALUES 
    ('Preparación del terreno', 'Limpieza y nivelación del área a pavimentar', 1),
    ('Colocación de base granular', 'Extendido y compactación de material granular', 2),
    ('Aplicación de imprimación', 'Aplicación de emulsión asfáltica como imprimación', 3),
    ('Colocación de mezcla asfáltica', 'Extendido de la mezcla asfáltica en caliente', 4),
    ('Compactación final', 'Compactación de la carpeta asfáltica', 5),
    ('Control de calidad', 'Verificación de espesores y densidades', 6)
) AS tareas_ejemplo(tarea_nombre, tarea_descripcion, tarea_orden)
WHERE t.id IS NULL
  AND (a.tipo_actividad ILIKE '%paviment%'
    OR a.tipo_actividad ILIKE '%asfalto%'
    OR a.tipo_actividad ILIKE '%carpeta%');

-- Insertar tareas genéricas para otras actividades sin tareas
INSERT INTO tareas (actividad_id, nombre, descripcion, completada, orden, fecha_creacion)
SELECT 
  a.id,
  tarea_nombre,
  tarea_descripcion,
  false,
  tarea_orden,
  NOW()
FROM actividades a
LEFT JOIN tareas t ON a.id = t.actividad_id
CROSS JOIN (
  VALUES 
    ('Preparación inicial', 'Preparación y organización de materiales y herramientas', 1),
    ('Ejecución principal', 'Desarrollo de la actividad principal', 2),
    ('Control de calidad', 'Verificación y control de la calidad del trabajo', 3),
    ('Limpieza final', 'Limpieza del área de trabajo', 4)
) AS tareas_genericas(tarea_nombre, tarea_descripcion, tarea_orden)
WHERE t.id IS NULL
  AND NOT (a.tipo_actividad ILIKE '%paviment%'
        OR a.tipo_actividad ILIKE '%asfalto%'
        OR a.tipo_actividad ILIKE '%carpeta%');