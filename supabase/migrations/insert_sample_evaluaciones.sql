-- Insertar datos de muestra para evaluaciones
-- Nota: Estos UUIDs deben corresponder a usuarios y obras existentes en la base de datos

-- Primero, obtener algunos IDs de usuarios y obras existentes para las evaluaciones
-- Insertar evaluaciones de muestra
INSERT INTO evaluaciones (id, evaluador_id, evaluado_id, obra_id, tipo_evaluacion, criterios, puntuacion_total, comentarios, fecha_evaluacion) 
SELECT 
    gen_random_uuid(),
    u1.id as evaluador_id,
    u2.id as evaluado_id,
    o.id as obra_id,
    'Desempeño General' as tipo_evaluacion,
    jsonb_build_object(
        'criterios', jsonb_build_array(
            jsonb_build_object('nombre', 'Puntualidad', 'puntuacion', 4, 'peso', 1.0),
            jsonb_build_object('nombre', 'Productividad', 'puntuacion', 5, 'peso', 1.5),
            jsonb_build_object('nombre', 'Trabajo en Equipo', 'puntuacion', 4, 'peso', 1.2),
            jsonb_build_object('nombre', 'Iniciativa', 'puntuacion', 3, 'peso', 1.0)
        )
    ) as criterios,
    4.2 as puntuacion_total,
    'Buen desempeño general, puede mejorar en iniciativa' as comentarios,
    CURRENT_DATE - INTERVAL '5 days' as fecha_evaluacion
FROM 
    (SELECT id FROM users WHERE rol = 'supervisor' LIMIT 1) u1,
    (SELECT id FROM users WHERE rol = 'trabajador' LIMIT 1) u2,
    (SELECT id FROM obras LIMIT 1) o
WHERE u1.id IS NOT NULL AND u2.id IS NOT NULL AND o.id IS NOT NULL;

-- Insertar segunda evaluación
INSERT INTO evaluaciones (id, evaluador_id, evaluado_id, obra_id, tipo_evaluacion, criterios, puntuacion_total, comentarios, fecha_evaluacion) 
SELECT 
    gen_random_uuid(),
    u1.id as evaluador_id,
    u2.id as evaluado_id,
    o.id as obra_id,
    'Seguridad' as tipo_evaluacion,
    jsonb_build_object(
        'criterios', jsonb_build_array(
            jsonb_build_object('nombre', 'Uso de EPP', 'puntuacion', 5, 'peso', 2.0),
            jsonb_build_object('nombre', 'Cumplimiento de Normas', 'puntuacion', 4, 'peso', 1.8),
            jsonb_build_object('nombre', 'Reporte de Incidentes', 'puntuacion', 5, 'peso', 1.5)
        )
    ) as criterios,
    4.6 as puntuacion_total,
    'Excelente cumplimiento de normas de seguridad' as comentarios,
    CURRENT_DATE - INTERVAL '3 days' as fecha_evaluacion
FROM 
    (SELECT id FROM users WHERE rol = 'supervisor' LIMIT 1) u1,
    (SELECT id FROM users WHERE rol = 'trabajador' OFFSET 1 LIMIT 1) u2,
    (SELECT id FROM obras LIMIT 1) o
WHERE u1.id IS NOT NULL AND u2.id IS NOT NULL AND o.id IS NOT NULL;

-- Insertar tercera evaluación
INSERT INTO evaluaciones (id, evaluador_id, evaluado_id, obra_id, tipo_evaluacion, criterios, puntuacion_total, comentarios, fecha_evaluacion) 
SELECT 
    gen_random_uuid(),
    u1.id as evaluador_id,
    u2.id as evaluado_id,
    o.id as obra_id,
    'Calidad' as tipo_evaluacion,
    jsonb_build_object(
        'criterios', jsonb_build_array(
            jsonb_build_object('nombre', 'Precisión', 'puntuacion', 4, 'peso', 1.8),
            jsonb_build_object('nombre', 'Acabados', 'puntuacion', 5, 'peso', 1.5),
            jsonb_build_object('nombre', 'Uso de Materiales', 'puntuacion', 4, 'peso', 1.2)
        )
    ) as criterios,
    4.4 as puntuacion_total,
    'Muy buenos acabados, precisión adecuada' as comentarios,
    CURRENT_DATE - INTERVAL '1 day' as fecha_evaluacion
FROM 
    (SELECT id FROM users WHERE rol = 'supervisor' LIMIT 1) u1,
    (SELECT id FROM users WHERE rol = 'trabajador' LIMIT 1) u2,
    (SELECT id FROM obras LIMIT 1) o
WHERE u1.id IS NOT NULL AND u2.id IS NOT NULL AND o.id IS NOT NULL;

-- Insertar evaluación adicional para tener más datos
INSERT INTO evaluaciones (id, evaluador_id, evaluado_id, obra_id, tipo_evaluacion, criterios, puntuacion_total, comentarios, fecha_evaluacion) 
SELECT 
    gen_random_uuid(),
    u1.id as evaluador_id,
    u2.id as evaluado_id,
    o.id as obra_id,
    'Desempeño General' as tipo_evaluacion,
    jsonb_build_object(
        'criterios', jsonb_build_array(
            jsonb_build_object('nombre', 'Puntualidad', 'puntuacion', 5, 'peso', 1.0),
            jsonb_build_object('nombre', 'Productividad', 'puntuacion', 4, 'peso', 1.5),
            jsonb_build_object('nombre', 'Trabajo en Equipo', 'puntuacion', 5, 'peso', 1.2),
            jsonb_build_object('nombre', 'Iniciativa', 'puntuacion', 4, 'peso', 1.0)
        )
    ) as criterios,
    4.5 as puntuacion_total,
    'Excelente puntualidad y trabajo en equipo' as comentarios,
    CURRENT_DATE as fecha_evaluacion
FROM 
    (SELECT id FROM users WHERE rol = 'supervisor' OFFSET 1 LIMIT 1) u1,
    (SELECT id FROM users WHERE rol = 'trabajador' OFFSET 1 LIMIT 1) u2,
    (SELECT id FROM obras OFFSET 1 LIMIT 1) o
WHERE u1.id IS NOT NULL AND u2.id IS NOT NULL AND o.id IS NOT NULL;

-- Si no hay suficientes usuarios o obras, crear evaluaciones con datos genéricos
-- Solo se ejecutará si las consultas anteriores no insertaron datos
INSERT INTO evaluaciones (id, evaluador_id, evaluado_id, obra_id, tipo_evaluacion, criterios, puntuacion_total, comentarios, fecha_evaluacion)
SELECT 
    '550e8400-e29b-41d4-a716-446655440010',
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM users OFFSET 1 LIMIT 1),
    (SELECT id FROM obras LIMIT 1),
    'Demo - Desempeño General',
    jsonb_build_object(
        'criterios', jsonb_build_array(
            jsonb_build_object('nombre', 'Puntualidad', 'puntuacion', 4, 'peso', 1.0),
            jsonb_build_object('nombre', 'Productividad', 'puntuacion', 5, 'peso', 1.5)
        )
    ),
    4.3,
    'Evaluación de demostración',
    CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM evaluaciones LIMIT 1);