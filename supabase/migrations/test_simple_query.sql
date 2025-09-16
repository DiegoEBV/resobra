-- Test simple para verificar datos y permisos

-- 1. Contar actividades sin filtros (como administrador)
SELECT COUNT(*) as total_actividades FROM actividades;

-- 2. Mostrar algunas actividades de ejemplo
SELECT 
    id,
    tipo_actividad,
    fecha,
    responsable,
    estado,
    user_id,
    obra_id,
    frente_id
FROM actividades 
LIMIT 3;

-- 3. Verificar si hay usuarios en la tabla users
SELECT COUNT(*) as total_users FROM users;

-- 4. Verificar si hay frentes
SELECT COUNT(*) as total_frentes FROM frentes;

-- 5. Verificar si hay obras
SELECT COUNT(*) as total_obras FROM obras;

-- 6. Crear datos de prueba si no existen
INSERT INTO actividades (
    obra_id,
    frente_id, 
    user_id,
    tipo_actividad,
    fecha,
    responsable,
    estado,
    observaciones,
    ubicacion
) 
SELECT 
    (SELECT id FROM obras LIMIT 1),
    (SELECT id FROM frentes LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Mantenimiento de Vía',
    CURRENT_DATE,
    'Supervisor de Obra',
    'programado',
    'Actividad de prueba para debugging',
    '{"lat": -12.0464, "lng": -77.0428}'
WHERE NOT EXISTS (SELECT 1 FROM actividades)
    AND EXISTS (SELECT 1 FROM obras)
    AND EXISTS (SELECT 1 FROM frentes)
    AND EXISTS (SELECT 1 FROM users);

-- 7. Verificar el resultado después de la inserción
SELECT COUNT(*) as actividades_despues_insert FROM actividades;